/* =========================================================
   BDL MES - IGQC TESTING RECORDS
   Overall testing result + final IGQC approval/rejection
   Same page: RESULT button opens result below details.

   Supports:
   - Chemical Lab Result
   - Mechanical Lab Result
   - Dimensional Lab Result can be added later
   ========================================================= */

(() => {
    "use strict";

    // =========================================================
    // API
    // =========================================================

    const API = "/api/igqc/testing";

    const CHEM_RESULT_API =
        "/api/chemical-lab-result";

    const MECHANICAL_RESULT_API =
        "/api/mechanical-lab-result";

    const FINAL_DECISION_API =
        "/api/igqc/result/decision";


    // =========================================================
    // HELPER
    // =========================================================

    const $ = id =>
        document.getElementById(id);


    // =========================================================
    // STATE
    // =========================================================

    let allRecords = [];

    let displayedRecords = [];

    let selectedRecord = null;

    /*
     * Keep results separately.
     *
     * selectedResults:
     * {
     *     chemical: {...},
     *     mechanical: {...}
     * }
     */
    let selectedResults = {};

    let selectedDecision = null;


    // =========================================================
    // INITIALIZE
    // =========================================================

    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    async function init() {

        bindEvents();

        updateClearButton();

        await loadRecords();
    }


    // =========================================================
    // EVENTS
    // =========================================================

    function bindEvents() {

        $("searchButton")
            ?.addEventListener(
                "click",
                runSearch
            );


        $("recordSearch")
            ?.addEventListener(
                "keydown",
                e => {

                    if (e.key === "Enter") {

                        e.preventDefault();

                        runSearch();
                    }
                }
            );


        $("recordSearch")
            ?.addEventListener(
                "input",
                updateClearButton
            );


        $("clearSearch")
            ?.addEventListener(
                "click",
                clearSearch
            );


        $("scanButton")
            ?.addEventListener(
                "click",
                openScan
            );


        $("closeScan")
            ?.addEventListener(
                "click",
                closeScan
            );


        $("cancelScan")
            ?.addEventListener(
                "click",
                closeScan
            );


        $("processScan")
            ?.addEventListener(
                "click",
                processQrScan
            );


        $("qrModal")
            ?.addEventListener(
                "click",
                e => {

                    if (
                        e.target ===
                        $("qrModal")
                    ) {

                        closeScan();
                    }
                }
            );


        $("qrData")
            ?.addEventListener(
                "keydown",
                e => {

                    if (
                        e.ctrlKey &&
                        e.key === "Enter"
                    ) {

                        e.preventDefault();

                        processQrScan();
                    }
                }
            );


        $("closeDetails")
            ?.addEventListener(
                "click",
                closeDetails
            );


        $("approveResult")
            ?.addEventListener(
                "click",
                () =>
                    saveDecision("Approved")
            );


        $("rejectResult")
            ?.addEventListener(
                "click",
                () =>
                    saveDecision("Rejected")
            );


        $("ownerApproval")
            ?.addEventListener(
                "change",
                () => {

                    updateApprovalButton();
                }
            );
    }


    // =========================================================
    // LOAD IGQC RECORDS
    // =========================================================

    async function loadRecords() {

        showMessage(
            "searchMessage",
            "Loading IGQC testing records...",
            "info"
        );


        try {

            const response =
                await fetch(
                    API,
                    {
                        headers: {
                            Accept:
                                "application/json"
                        },

                        cache:
                            "no-store"
                    }
                );


            const data =
                await readJson(
                    response
                );


            if (
                !response.ok ||
                data.success === false
            ) {

                throw new Error(
                    data.message ||
                    `Unable to load testing records. HTTP ${response.status}`
                );
            }


            allRecords =
                Array.isArray(data.records)
                    ? data.records
                    : Array.isArray(data.assignments)
                        ? data.assignments
                        : [];


            /*
             * Final decisions are stored separately.
             */
            await overlayFinalDecisions();


            sortRecords();


            displayedRecords =
                [...allRecords];


            renderRecords(
                displayedRecords
            );


            hideMessage(
                "searchMessage"
            );

        }
        catch (error) {

            console.error(
                "IGQC testing records load error:",
                error
            );


            allRecords = [];

            displayedRecords = [];


            renderRecords([]);


            showMessage(
                "searchMessage",
                error.message ||
                "Unable to load testing records.",
                "error"
            );
        }
    }


    // =========================================================
    // OVERLAY FINAL DECISIONS
    // =========================================================

    async function overlayFinalDecisions() {

        try {

            const response =
                await fetch(
                    FINAL_DECISION_API,
                    {
                        headers: {
                            Accept:
                                "application/json"
                        },

                        cache:
                            "no-store"
                    }
                );


            if (
                response.status ===
                404
            ) {

                return;
            }


            const data =
                await readJson(
                    response
                );


            if (
                !response.ok ||
                data.success === false
            ) {

                return;
            }


            const decisions =
                Array.isArray(
                    data.decisions
                )
                    ? data.decisions
                    : Array.isArray(
                        data.records
                    )
                        ? data.records
                        : [];


            const map =
                new Map(
                    decisions.map(
                        x => [
                            normalize(
                                x.assignmentId
                            ),
                            x
                        ]
                    )
                );


            allRecords.forEach(
                record => {

                    const decision =
                        map.get(
                            normalize(
                                record.assignmentId
                            )
                        );


                    if (!decision)
                        return;


                    record.finalStatus =
                        decision.status ||
                        decision.finalStatus ||
                        decision.decision ||
                        "";


                    record.finalRemarks =
                        decision.remarks ||
                        decision.finalRemarks ||
                        "";


                    record.finalDecisionDate =
                        decision.decisionDate ||
                        decision.finalDecisionDate ||
                        "";


                    record.finalDecisionTime =
                        decision.decisionTime ||
                        decision.finalDecisionTime ||
                        "";
                }
            );

        }
        catch (error) {

            console.warn(
                "Final IGQC decision overlay unavailable:",
                error
            );
        }
    }


    // =========================================================
    // SORT
    // =========================================================

    function sortRecords() {

        allRecords.sort(
            (a, b) => {

                const left =
                    `${b.date || ""} ${b.time || ""}`;


                const right =
                    `${a.date || ""} ${a.time || ""}`;


                return left.localeCompare(
                    right
                );
            }
        );
    }


    // =========================================================
    // SEARCH
    // =========================================================

    function runSearch() {

        const query =
            normalize(
                $("recordSearch")?.value
            );


        displayedRecords =
            query
                ? allRecords.filter(
                    record =>
                        [
                            record.assignmentId,
                            record.po,
                            record.so,
                            record.materialId,
                            record.grn,
                            record.materialName,
                            record.vendor
                        ].some(
                            value =>
                                normalize(value)
                                    .includes(query)
                        )
                )
                : [...allRecords];


        renderRecords(
            displayedRecords
        );


        closeDetails();


        updateClearButton();


        if (query) {

            showMessage(
                "searchMessage",

                `${displayedRecords.length} testing record(s) found.`,

                displayedRecords.length
                    ? "success"
                    : "error"
            );

        }
        else {

            hideMessage(
                "searchMessage"
            );
        }
    }


    // =========================================================
    // CLEAR SEARCH
    // =========================================================

    function clearSearch() {

        const input =
            $("recordSearch");


        if (input) {

            input.value =
                "";

            input.focus();
        }


        displayedRecords =
            [...allRecords];


        renderRecords(
            displayedRecords
        );


        closeDetails();


        hideMessage(
            "searchMessage"
        );


        updateClearButton();
    }


    function updateClearButton() {

        const input =
            $("recordSearch");


        const button =
            $("clearSearch");


        if (
            input &&
            button
        ) {

            button.classList.toggle(
                "hidden",
                !input.value.trim()
            );
        }
    }


    // =========================================================
    // RENDER RECORD TABLE
    // =========================================================

    function renderRecords(records) {

        const body =
            $("recordsBody");


        if (!body)
            return;


        body.innerHTML =
            "";


        const count =
            $("recordCount");


        if (count) {

            count.textContent =
                `${records.length} RECORD${records.length === 1 ? "" : "S"}`;
        }


        $("emptyState")
            ?.classList.toggle(
                "hidden",
                records.length > 0
            );


        [...records]
            .sort(
                (a, b) =>
                    `${b.date || ""} ${b.time || ""}`
                        .localeCompare(
                            `${a.date || ""} ${a.time || ""}`
                        )
            )
            .forEach(
                record => {

                    const status =
                        getOverallStatus(
                            record
                        );


                    const completed =
                        statusIsCompleted(
                            status
                        );


                    const final =
                        normalize(
                            record.finalStatus
                        );


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `
                        <td>
                            <button
                                type="button"
                                class="assignment-button">
                                ${escapeHtml(
                        record.assignmentId ||
                        "-"
                    )}
                            </button>
                        </td>

                        <td>
                            ${display(record.date)}
                        </td>

                        <td>
                            ${display(record.time)}
                        </td>

                        <td>
                            ${display(record.po)}
                        </td>

                        <td>
                            ${display(record.so)}
                        </td>

                        <td
                            title="${escapeAttr(
                        record.materialName || ""
                    )}">
                            ${display(
                        record.materialId
                    )}
                        </td>

                        <td>
                            ${display(
                        record.vendor
                    )}
                        </td>

                        <td>
                            ${display(
                        record.grn
                    )}
                        </td>

                        <td>
                            ${getTestingTypes(record)
                            .map(
                                x =>
                                    `<span class="testing-badge">
                                                ${escapeHtml(x)}
                                            </span>`
                            )
                            .join(" ") ||
                        "-"
                        }
                        </td>

                        <td>
                            <span
                                class="status-badge ${statusClass(
                            final || status
                        )}">
                                ${escapeHtml(
                            final
                                ? record.finalStatus
                                : status
                        )}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="result-action-button"
                                ${completed
                            ? ""
                            : "disabled"}>
                                ${completed
                            ? "VIEW RESULT"
                            : "RESULT"
                        }
                            </button>
                        </td>
                    `;


                    row.addEventListener(
                        "click",
                        () =>
                            showDetails(
                                record,
                                false
                            )
                    );


                    row.querySelector(
                        ".assignment-button"
                    )
                        ?.addEventListener(
                            "click",
                            e => {

                                e.stopPropagation();

                                showDetails(
                                    record,
                                    false
                                );
                            }
                        );


                    row.querySelector(
                        ".result-action-button"
                    )
                        ?.addEventListener(
                            "click",
                            e => {

                                e.stopPropagation();


                                if (completed) {

                                    showDetails(
                                        record,
                                        true
                                    );
                                }
                            }
                        );


                    body.appendChild(
                        row
                    );
                }
            );
    }


    // =========================================================
    // SHOW DETAILS
    // =========================================================

    async function showDetails(
        record,
        openResult
    ) {

        selectedRecord =
            record;


        selectedResults =
            {};


        selectedDecision =
            null;


        resetResultPanel();


        renderAssignment(
            record
        );


        $("detailsPanel")
            ?.classList.remove(
                "hidden"
            );


        requestAnimationFrame(
            () => {

                $("detailsPanel")
                    ?.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });
            }
        );


        if (
            openResult &&
            statusIsCompleted(
                getOverallStatus(record)
            )
        ) {

            await loadResult(
                record
            );
        }
    }


    // =========================================================
    // RENDER ASSIGNMENT
    // =========================================================

    function renderAssignment(
        record
    ) {

        $("materialDetails").innerHTML =
            [
                cell(
                    "ASSIGNMENT ID",
                    record.assignmentId
                ),

                cell(
                    "DATE",
                    record.date
                ),

                cell(
                    "TIME",
                    record.time
                ),

                cell(
                    "PURCHASE ORDER",
                    record.po
                ),

                cell(
                    "SALES ORDER",
                    record.so
                ),

                cell(
                    "MATERIAL ID",
                    record.materialId
                ),

                cell(
                    "GRN",
                    record.grn
                ),

                cell(
                    "MATERIAL NAME",
                    record.materialName
                ),

                cell(
                    "VENDOR",
                    record.vendor
                ),

                cell(
                    "UNIT",
                    record.unit
                )
            ].join("");


        const cards = [];


        // =====================================================
        // CHEMICAL
        // =====================================================

        if (
            truthy(
                record.chemicalTesting
            )
        ) {

            cards.push(
                testCard(
                    "chemical",
                    "Chemical Testing",
                    record.chemicalGrade,
                    record.chemicalQuantity,
                    record.chemicalEquipment,
                    record.chemicalSampleConsumed,
                    record.chemicalStatus
                )
            );
        }


        // =====================================================
        // MECHANICAL
        // =====================================================

        if (
            truthy(
                record.mechanicalTesting
            )
        ) {

            cards.push(
                testCard(
                    "mechanical",
                    "Mechanical Testing",
                    record.mechanicalGrade,
                    record.mechanicalQuantity,
                    record.mechanicalEquipment,
                    record.mechanicalSampleConsumed,
                    record.mechanicalStatus
                )
            );
        }


        // =====================================================
        // DIMENSIONAL
        // =====================================================

        if (
            truthy(
                record.dimensionalTesting
            )
        ) {

            cards.push(
                testCard(
                    "dimensional",
                    "Dimensional Testing",
                    record.dimensionalGrade,
                    record.dimensionalQuantity,
                    record.dimensionalEquipment,
                    record.dimensionalSampleConsumed,
                    record.dimensionalStatus
                )
            );
        }


        $("testingDetails").innerHTML =
            cards.join("") ||
            testCard(
                "",
                "Testing",
                "",
                "",
                "",
                "",
                "Not Selected"
            );
    }


    // =========================================================
    // LOAD ALL COMPLETED RESULTS
    // =========================================================

    async function loadResult(
        record
    ) {

        const panel =
            $("igqcResultPanel");


        const loading =
            $("resultLoading");


        if (!panel)
            return;


        panel.classList.remove(
            "hidden"
        );


        loading?.classList.remove(
            "hidden"
        );


        hideDecisionMessage();


        selectedResults =
            {};


        try {

            /*
             * =================================================
             * BUILD REQUESTS
             * =================================================
             *
             * Only request result APIs for testing types that
             * were actually selected in the IGQC assignment.
             */

            const requests = [];


            if (
                truthy(
                    record.chemicalTesting
                )
            ) {

                requests.push(
                    loadSingleResult(
                        "chemical",
                        CHEM_RESULT_API,
                        record.assignmentId
                    )
                );
            }


            if (
                truthy(
                    record.mechanicalTesting
                )
            ) {

                requests.push(
                    loadSingleResult(
                        "mechanical",
                        MECHANICAL_RESULT_API,
                        record.assignmentId
                    )
                );
            }


            /*
             * Dimensional Result API is intentionally not added
             * yet because it has not been implemented in the
             * current workflow.
             */


            const results =
                await Promise.all(
                    requests
                );


            /*
             * Check whether at least one result was loaded.
             */
            const loaded =
                results.filter(
                    x =>
                        x.record
                );


            if (!loaded.length) {

                throw new Error(
                    "No completed testing result was found for this assignment."
                );
            }


            loaded.forEach(
                item => {

                    selectedResults[
                        item.type
                    ] =
                        item.record;
                }
            );


            /*
             * Load final IGQC decision separately.
             */
            selectedDecision =
                await loadDecision(
                    record.assignmentId
                );


            renderAllResults(
                selectedResults,
                selectedDecision
            );

        }
        catch (error) {

            console.error(
                "IGQC result load error:",
                error
            );


            decisionMessage(
                error.message ||
                "Unable to load testing result.",
                "error"
            );

        }
        finally {

            loading?.classList.add(
                "hidden"
            );
        }
    }


    // =========================================================
    // LOAD SINGLE RESULT
    // =========================================================

    async function loadSingleResult(
        type,
        api,
        assignmentId
    ) {

        try {

            const response =
                await fetch(
                    `${api}/${encodeURIComponent(
                        assignmentId
                    )}`,
                    {
                        headers: {
                            Accept:
                                "application/json"
                        },

                        cache:
                            "no-store"
                    }
                );


            /*
             * 404 means this result has not been created.
             *
             * Do not fail the entire approval screen.
             */
            if (
                response.status ===
                404
            ) {

                return {
                    type,
                    record: null
                };
            }


            const data =
                await readJson(
                    response
                );


            if (
                !response.ok ||
                data.success === false
            ) {

                throw new Error(
                    data.message ||
                    `Unable to load ${type} testing result. HTTP ${response.status}`
                );
            }


            const record =
                data.record ||
                data.result ||
                data.data;


            if (!record) {

                throw new Error(
                    `${capitalize(type)} testing result data is empty.`
                );
            }


            return {
                type,
                record
            };

        }
        catch (error) {

            /*
             * For a selected testing type, an actual API failure
             * should be reported.
             */
            console.error(
                `${type} result load error:`,
                error
            );


            throw error;
        }
    }


    // =========================================================
    // LOAD FINAL DECISION
    // =========================================================

    async function loadDecision(
        assignmentId
    ) {

        try {

            const response =
                await fetch(
                    `${FINAL_DECISION_API}/${encodeURIComponent(
                        assignmentId
                    )}`,
                    {
                        headers: {
                            Accept:
                                "application/json"
                        },

                        cache:
                            "no-store"
                    }
                );


            if (
                response.status ===
                404
            ) {

                return null;
            }


            const data =
                await readJson(
                    response
                );


            if (
                !response.ok ||
                data.success === false
            ) {

                return null;
            }


            return (
                data.decision ||
                data.record ||
                data.data ||
                null
            );

        }
        catch (error) {

            console.warn(
                "Unable to load final decision:",
                error
            );


            return null;
        }
    }


    // =========================================================
    // RENDER ALL RESULTS
    // =========================================================

    function renderAllResults(
        results,
        decision
    ) {

        const resultTypes =
            Object.keys(
                results
            );


        /*
         * If the existing HTML only has one result summary
         * container, we dynamically build the complete result
         * section inside it.
         */
        const summary =
            $("resultSummary");


        const tables =
            $("resultTables");


        if (!summary || !tables)
            return;


        summary.innerHTML =
            "";


        tables.innerHTML =
            "";


        /*
         * =====================================================
         * RESULT SUMMARY
         * =====================================================
         */

        resultTypes.forEach(
            type => {

                const result =
                    results[type];


                summary.innerHTML +=
                    renderResultSummary(
                        type,
                        result
                    );
            }
        );


        /*
         * =====================================================
         * RESULT TABLES
         * =====================================================
         */

        resultTypes.forEach(
            type => {

                const result =
                    results[type];


                tables.innerHTML +=
                    renderResultSection(
                        type,
                        result
                    );
            }
        );


        /*
         * =====================================================
         * OVERALL TESTING STATUS
         * =====================================================
         */

        const overall =
            calculateOverallResult(
                results
            );


        tables.innerHTML +=
            `
                <div class="igqc-overall-result">
                    <div class="igqc-overall-label">
                        OVERALL TEST RESULT
                    </div>

                    <div class="igqc-overall-value ${overall.className}">
                        ${escapeHtml(
                overall.text
            )}
                    </div>
                </div>
            `;


        /*
         * =====================================================
         * DECISION AREA
         * =====================================================
         */

        renderDecisionArea(
            results,
            decision
        );
    }


    // =========================================================
    // RESULT SUMMARY
    // =========================================================

    function renderResultSummary(
        type,
        result
    ) {

        const prefix =
            capitalize(type);


        const resultId =
            result.resultId ||
            "-";


        const resultStatus =
            result.resultStatus ||
            "Completed";


        let status =
            resultStatus;


        if (
            type ===
            "chemical"
        ) {

            status =
                result.chemicalStatus ||
                resultStatus;
        }


        if (
            type ===
            "mechanical"
        ) {

            status =
                result.mechanicalStatus ||
                resultStatus;
        }


        const entryDate =
            result.resultEntryDate ||
            "-";


        const entryTime =
            result.resultEntryTime ||
            "";


        return `
            <div class="result-summary-group ${escapeHtml(type)}">

                <div class="result-summary-title">
                    ${escapeHtml(
            prefix
        )} Testing Result
                </div>

                <div class="result-summary-grid">

                    <div class="result-summary-cell">
                        <div class="result-summary-label">
                            RESULT ID
                        </div>

                        <div class="result-summary-value">
                            ${display(resultId)}
                        </div>
                    </div>


                    <div class="result-summary-cell">
                        <div class="result-summary-label">
                            TEST STATUS
                        </div>

                        <div class="result-summary-value">
                            ${display(resultStatus)}
                        </div>
                    </div>


                    <div class="result-summary-cell">
                        <div class="result-summary-label">
                            ${escapeHtml(
            prefix
        ).toUpperCase()} STATUS
                        </div>

                        <div class="result-summary-value">
                            <span class="status-badge ${statusClass(status)}">
                                ${escapeHtml(status)}
                            </span>
                        </div>
                    </div>


                    <div class="result-summary-cell">
                        <div class="result-summary-label">
                            RESULT DATE / TIME
                        </div>

                        <div class="result-summary-value">
                            ${display(
            `${entryDate} ${entryTime}`.trim()
        )}
                        </div>
                    </div>

                </div>

            </div>
        `;
    }


    // =========================================================
    // RESULT SECTION
    // =========================================================

    function renderResultSection(
        type,
        result
    ) {

        const rows =
            Array.isArray(
                result.results
            )
                ? result.results
                : [];


        const title =
            `${capitalize(type)} Testing Result`;


        if (!rows.length) {

            return `
                <div class="result-section ${escapeHtml(type)}">

                    <div class="result-section-header">
                        ${escapeHtml(title)}
                    </div>

                    <div class="result-table-wrap">

                        <table class="result-table">

                            <tbody>
                                <tr>
                                    <td colspan="5">
                                        No result rows recorded.
                                    </td>
                                </tr>
                            </tbody>

                        </table>

                    </div>

                </div>
            `;
        }


        return `
            <div class="result-section ${escapeHtml(type)}">

                <div class="result-section-header">
                    ${escapeHtml(title)}
                </div>

                <div class="result-table-wrap">

                    <table class="result-table">

                        <thead>

                            <tr>
                                <th>S.NO</th>
                                <th>TEST PARAMETER</th>
                                <th>SPECIFICATION / EXPECTED RESULT</th>
                                <th>ACTUAL RESULT</th>
                                <th>CONFORMANCE</th>
                            </tr>

                        </thead>

                        <tbody>

                            ${rows.map(
            (row, index) =>
                renderResultRow(
                    row,
                    index
                )
        ).join("")}

                        </tbody>

                    </table>

                </div>

            </div>
        `;
    }


    // =========================================================
    // RESULT ROW
    // =========================================================

    function renderResultRow(
        row,
        index
    ) {

        const sno =
            row.sno ??
            row.Sno ??
            index + 1;


        const parameter =
            row.testParameter ??
            row.TestParameter ??
            "";


        const specification =
            row.specification ??
            row.Specification ??
            "";


        /*
         * Supports both:
         *
         * result
         * actualResult
         * ActualResult
         */
        const actual =
            row.result ??
            row.actualResult ??
            row.ActualResult ??
            "";


        const conformance =
            row.conformance ??
            row.Conformance ??
            "Pending";


        const conformanceClass =
            normalize(
                conformance
            ) ===
                "conforming"
                ? "conforming"
                : normalize(
                    conformance
                ) ===
                    "not conforming"
                    ? "not-conforming"
                    : "pending";


        return `
            <tr>

                <td>
                    ${escapeHtml(sno)}
                </td>

                <td>
                    ${display(parameter)}
                </td>

                <td>
                    ${display(specification)}
                </td>

                <td>
                    ${display(actual)}
                </td>

                <td>

                    <span
                        class="conformance-badge ${conformanceClass}">
                        ${escapeHtml(
            conformance
        )}
                    </span>

                </td>

            </tr>
        `;
    }


    // =========================================================
    // CALCULATE OVERALL RESULT
    // =========================================================

    function calculateOverallResult(
        results
    ) {

        const allRows = [];


        Object.values(
            results
        ).forEach(
            result => {

                if (
                    Array.isArray(
                        result.results
                    )
                ) {

                    result.results.forEach(
                        row =>
                            allRows.push(
                                row
                            )
                    );
                }
            }
        );


        if (!allRows.length) {

            return {
                text:
                    "RESULT NOT COMPLETED",

                className:
                    "pending"
            };
        }


        const statuses =
            allRows.map(
                row =>
                    normalize(
                        row.conformance ??
                        row.Conformance
                    )
            );


        if (
            statuses.some(
                status =>
                    status ===
                    "pending" ||
                    !status
            )
        ) {

            return {
                text:
                    "RESULT NOT COMPLETED",

                className:
                    "pending"
            };
        }


        if (
            statuses.every(
                status =>
                    status ===
                    "conforming"
            )
        ) {

            return {
                text:
                    "ALL RESULTS CONFORMING",

                className:
                    "good"
            };
        }


        return {
            text:
                "NOT CONFORMING",

            className:
                "bad"
        };
    }


    // =========================================================
    // RESULT APPROVAL CHECK
    // =========================================================

    function resultCanBeApproved(
        results
    ) {

        const allRows = [];


        Object.values(
            results || {}
        ).forEach(
            result => {

                if (
                    Array.isArray(
                        result?.results
                    )
                ) {

                    result.results.forEach(
                        row =>
                            allRows.push(
                                row
                            )
                    );
                }
            }
        );


        if (!allRows.length) {

            return false;
        }


        /*
         * Every test must have a conformance result.
         */
        const hasPending =
            allRows.some(
                row =>
                    normalize(
                        row.conformance ??
                        row.Conformance
                    ) ===
                    "pending"
            );


        if (hasPending) {

            return false;
        }


        /*
         * All conforming:
         * normal approval is allowed.
         */
        const allConforming =
            allRows.every(
                row =>
                    normalize(
                        row.conformance ??
                        row.Conformance
                    ) ===
                    "conforming"
            );


        if (allConforming) {

            return true;
        }


        /*
         * One or more Not Conforming:
         * Owner Approval is required.
         */
        return (
            $("ownerApproval")?.checked ===
            true
        );
    }


    // =========================================================
    // UPDATE APPROVAL BUTTON
    // =========================================================

    function updateApprovalButton() {

        const approveButton =
            $("approveResult");


        if (!approveButton)
            return;


        approveButton.disabled =
            !resultCanBeApproved(
                selectedResults
            );


        approveButton.title =
            approveButton.disabled
                ? "Approval requires all results to be Conforming, or Owner Approval for a Not Conforming result."
                : "";
    }


    // =========================================================
    // RENDER DECISION AREA
    // =========================================================

    function renderDecisionArea(
        results,
        decision
    ) {

        const finalStatus =
            normalize(
                decision?.status ||
                decision?.finalStatus ||
                ""
            );


        /*
         * Already approved/rejected.
         */
        if (
            finalStatus ===
            "approved" ||
            finalStatus ===
            "rejected"
        ) {

            $("decisionArea")
                ?.classList.add(
                    "hidden"
                );


            const remarks =
                decision?.remarks ||
                decision?.finalRemarks ||
                "";


            decisionMessage(
                `${capitalize(finalStatus)} on ${decision?.decisionDate ||
                "-"
                } ${decision?.decisionTime ||
                ""
                }` +
                (
                    remarks
                        ? ` — Remarks: ${remarks}`
                        : ""
                ),

                finalStatus ===
                    "approved"
                    ? "success"
                    : "error"
            );


            return;
        }


        /*
         * New decision.
         */
        $("decisionArea")
            ?.classList.remove(
                "hidden"
            );


        if (
            $("decisionRemarks")
        ) {

            $("decisionRemarks")
                .value =
                "";
        }


        if (
            $("ownerApproval")
        ) {

            $("ownerApproval")
                .checked =
                false;
        }


        updateApprovalButton();


        const overall =
            calculateOverallResult(
                results
            );


        if (
            overall.className ===
            "bad"
        ) {

            decisionMessage(
                "One or more testing results are Not Conforming. Owner Approval is required to approve this IGQC result.",
                "error"
            );

        }
        else if (
            overall.className ===
            "good"
        ) {

            hideDecisionMessage();
        }
    }


    // =========================================================
    // SAVE FINAL DECISION
    // =========================================================

    async function saveDecision(
        status
    ) {

        if (
            !selectedRecord?.assignmentId
        ) {

            decisionMessage(
                "Select an IGQC testing assignment first.",
                "error"
            );

            return;
        }


        if (
            !Object.keys(
                selectedResults
            ).length
        ) {

            decisionMessage(
                "Load the completed testing results first.",
                "error"
            );

            return;
        }


        const remarks =
            $("decisionRemarks")
                ?.value
                .trim() ||
            "";


        // =====================================================
        // REJECT VALIDATION
        // =====================================================

        if (
            status ===
            "Rejected" &&
            !remarks
        ) {

            decisionMessage(
                "Remarks are required when rejecting the IGQC result.",
                "error"
            );


            $("decisionRemarks")
                ?.focus();


            return;
        }


        // =====================================================
        // APPROVE VALIDATION
        // =====================================================

        if (
            status ===
            "Approved"
        ) {

            if (
                !resultCanBeApproved(
                    selectedResults
                )
            ) {

                const overall =
                    calculateOverallResult(
                        selectedResults
                    );


                if (
                    overall.className ===
                    "bad"
                ) {

                    decisionMessage(
                        "IGQC result contains Not Conforming results. Owner Approval is required before approval.",
                        "error"
                    );

                }
                else {

                    decisionMessage(
                        "IGQC result cannot be approved until all testing results are completed.",
                        "error"
                    );
                }


                return;
            }
        }


        const approve =
            $("approveResult");


        const reject =
            $("rejectResult");


        if (approve)
            approve.disabled =
                true;


        if (reject)
            reject.disabled =
                true;


        try {

            /*
             * Keep the existing final decision API.
             *
             * Final decision is stored separately from
             * Chemical / Mechanical result Excel files.
             */
            const payload = {

                assignmentId:
                    selectedRecord.assignmentId,

                status:
                    status,

                remarks:
                    remarks
            };


            console.log(
                "Saving IGQC final decision:",
                payload
            );


            const response =
                await fetch(
                    FINAL_DECISION_API,
                    {
                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            ),

                        cache:
                            "no-store"
                    }
                );


            const data =
                await readJson(
                    response
                );


            if (
                !response.ok ||
                data.success === false
            ) {

                throw new Error(
                    data.message ||
                    data.detail ||
                    `Unable to save IGQC decision. HTTP ${response.status}`
                );
            }


            const decision =
                data.decision ||
                data.record ||
                data.data;


            if (decision) {

                selectedDecision =
                    decision;

            }
            else {

                selectedDecision = {

                    status:
                        status,

                    remarks:
                        remarks,

                    decisionDate:
                        new Date()
                            .toISOString()
                            .substring(
                                0,
                                10
                            ),

                    decisionTime:
                        new Date()
                            .toTimeString()
                            .substring(
                                0,
                                8
                            )
                };
            }


            /*
             * Update local record.
             */
            const index =
                allRecords.findIndex(
                    x =>
                        normalize(
                            x.assignmentId
                        ) ===
                        normalize(
                            selectedRecord.assignmentId
                        )
                );


            if (
                index >= 0
            ) {

                allRecords[index]
                    .finalStatus =
                    status;


                allRecords[index]
                    .finalRemarks =
                    remarks;


                allRecords[index]
                    .finalDecisionDate =
                    selectedDecision
                        ?.decisionDate ||
                    "";


                allRecords[index]
                    .finalDecisionTime =
                    selectedDecision
                        ?.decisionTime ||
                    "";


                selectedRecord =
                    allRecords[index];
            }


            renderRecords(
                displayedRecords
            );


            renderAllResults(
                selectedResults,
                selectedDecision
            );


            decisionMessage(
                data.message ||
                `IGQC result ${status.toLowerCase()} successfully.`,
                "success"
            );

        }
        catch (error) {

            console.error(
                "IGQC decision error:",
                error
            );


            if (approve) {

                approve.disabled =
                    !resultCanBeApproved(
                        selectedResults
                    );
            }


            if (reject) {

                reject.disabled =
                    false;
            }


            decisionMessage(
                error.message ||
                "Unable to save IGQC decision.",
                "error"
            );
        }
    }


    // =========================================================
    // RESET RESULT PANEL
    // =========================================================

    function resetResultPanel() {

        selectedResults =
            {};


        selectedDecision =
            null;


        $("igqcResultPanel")
            ?.classList.add(
                "hidden"
            );


        if (
            $("resultSummary")
        ) {

            $("resultSummary")
                .innerHTML =
                "";
        }


        if (
            $("resultTables")
        ) {

            $("resultTables")
                .innerHTML =
                "";
        }


        $("decisionArea")
            ?.classList.add(
                "hidden"
            );


        hideDecisionMessage();


        if (
            $("decisionRemarks")
        ) {

            $("decisionRemarks")
                .value =
                "";
        }


        if (
            $("ownerApproval")
        ) {

            $("ownerApproval")
                .checked =
                false;
        }
    }


    // =========================================================
    // CLOSE DETAILS
    // =========================================================

    function closeDetails() {

        selectedRecord =
            null;


        resetResultPanel();


        $("detailsPanel")
            ?.classList.add(
                "hidden"
            );
    }


    // =========================================================
    // QR
    // =========================================================

    function openScan() {

        $("qrModal")
            ?.classList.remove(
                "hidden"
            );


        const input =
            $("qrData");


        if (input) {

            input.value =
                "";


            setTimeout(
                () =>
                    input.focus(),
                50
            );
        }


        hideMessage(
            "scanMessage"
        );
    }


    function closeScan() {

        $("qrModal")
            ?.classList.add(
                "hidden"
            );


        hideMessage(
            "scanMessage"
        );
    }


    // =========================================================
    // QR PROCESS
    // =========================================================

    function processQrScan() {

        const raw =
            $("qrData")
                ?.value
                .trim() ||
            "";


        if (!raw) {

            showMessage(
                "scanMessage",
                "Enter or scan an R1 QR value.",
                "error"
            );

            return;
        }


        const parts =
            raw
                .split("|")
                .map(
                    part =>
                        part.trim()
                );


        if (
            parts.length !== 6 ||
            parts[0].toUpperCase() !==
            "R1"
        ) {

            showMessage(
                "scanMessage",

                "Invalid R1 QR format. Expected: R1|PO|SO|ID|Material|GRN",

                "error"
            );

            return;
        }


        const [
            ,
            po,
            so,
            materialId,
            ,
            grn
        ] =
            parts;


        const matches =
            allRecords.filter(
                record =>

                    normalize(
                        record.po
                    ) ===
                    normalize(po)

                    &&

                    normalize(
                        record.so
                    ) ===
                    normalize(so)

                    &&

                    normalize(
                        record.materialId
                    ) ===
                    normalize(materialId)

                    &&

                    normalize(
                        record.grn
                    ) ===
                    normalize(grn)
            );


        closeScan();


        if (
            !matches.length
        ) {

            displayedRecords =
                [];


            renderRecords([]);


            showMessage(
                "searchMessage",

                "No IGQC testing assignment was found for the scanned material.",

                "error"
            );


            return;
        }


        displayedRecords =
            matches;


        renderRecords(
            displayedRecords
        );


        closeDetails();


        if (
            $("recordSearch")
        ) {

            $("recordSearch")
                .value =
                materialId;
        }


        updateClearButton();


        showMessage(
            "searchMessage",

            `${matches.length} IGQC testing record(s) found for scanned material.`,

            "success"
        );
    }


    // =========================================================
    // TESTING TYPES
    // =========================================================

    function getTestingTypes(
        record
    ) {

        return [

            truthy(
                record.chemicalTesting
            ) &&
            "Chemical",

            truthy(
                record.mechanicalTesting
            ) &&
            "Mechanical",

            truthy(
                record.dimensionalTesting
            ) &&
            "Dimensional"

        ].filter(Boolean);
    }


    // =========================================================
    // OVERALL ASSIGNMENT STATUS
    // =========================================================

    function getOverallStatus(
        record
    ) {

        const statuses = [];


        if (
            truthy(
                record.chemicalTesting
            )
        ) {

            statuses.push(
                record.chemicalStatus ||
                "Pending"
            );
        }


        if (
            truthy(
                record.mechanicalTesting
            )
        ) {

            statuses.push(
                record.mechanicalStatus ||
                "Pending"
            );
        }


        if (
            truthy(
                record.dimensionalTesting
            )
        ) {

            statuses.push(
                record.dimensionalStatus ||
                "Pending"
            );
        }


        if (!statuses.length)
            return "-";


        if (
            statuses.every(
                status =>
                    statusIsCompleted(
                        status
                    )
            )
        ) {

            return "Completed";
        }


        return "Pending";
    }


    // =========================================================
    // COMPLETED STATUS
    // =========================================================

    function statusIsCompleted(
        status
    ) {

        const value =
            normalize(
                status
            );


        return (

            value ===
            "completed"

            ||

            value ===
            "completed - not conforming"

            ||

            value ===
            "completed-not-conforming"
        );
    }


    // =========================================================
    // STATUS CLASS
    // =========================================================

    function statusClass(
        status
    ) {

        const value =
            normalize(
                status
            );


        if (
            value ===
            "approved"
        ) {

            return "approved";
        }


        if (
            value ===
            "rejected"
        ) {

            return "rejected";
        }


        if (
            value ===
            "accepted"
        ) {

            return "accepted";
        }


        if (
            value.startsWith(
                "completed"
            )
        ) {

            return "completed";
        }


        return "pending";
    }


    // =========================================================
    // TEST CARD
    // =========================================================

    function testCard(
        cls,
        title,
        grade,
        quantity,
        equipment,
        sample,
        status
    ) {

        return `
            <div class="test-detail-card ${escapeHtml(cls)}">

                <h3>
                    ${escapeHtml(title)}
                </h3>

                ${testField(
            "STATUS",
            status ||
            "Pending",
            true
        )}

                ${testField(
            "GRADE",
            grade
        )}

                ${testField(
            "QUANTITY",
            quantity
        )}

                ${testField(
            "EQUIPMENT",
            equipment
        )}

                ${testField(
            "SAMPLE CONSUMED",
            sample
        )}

            </div>
        `;
    }


    function testField(
        label,
        value,
        isStatus = false
    ) {

        return `
            <div class="test-field">

                <span>
                    ${escapeHtml(label)}
                </span>

                <span>

                    ${isStatus

                ? `
                                <span class="status-badge ${statusClass(value)}">
                                    ${escapeHtml(value)}
                                </span>
                              `

                : display(value)
            }

                </span>

            </div>
        `;
    }


    // =========================================================
    // DETAIL CELL
    // =========================================================

    function cell(
        label,
        value
    ) {

        return `
            <div class="detail-cell">

                <div class="detail-label">
                    ${escapeHtml(label)}
                </div>

                <div class="detail-value">
                    ${display(value)}
                </div>

            </div>
        `;
    }


    // =========================================================
    // TRUTHY
    // =========================================================

    function truthy(
        value
    ) {

        return (

            value === true

            ||

            [
                "true",
                "yes",
                "1"
            ].includes(
                normalize(value)
            )
        );
    }


    // =========================================================
    // NORMALIZE
    // =========================================================

    function normalize(
        value
    ) {

        return value == null

            ? ""

            : String(value)
                .trim()
                .toLowerCase();
    }


    // =========================================================
    // DISPLAY
    // =========================================================

    function display(
        value
    ) {

        return (
            value == null ||
            value === ""
        )

            ? "-"

            : escapeHtml(value);
    }


    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    function escapeAttr(
        value
    ) {

        return escapeHtml(
            value
        );
    }


    // =========================================================
    // CAPITALIZE
    // =========================================================

    function capitalize(
        value
    ) {

        const text =
            String(
                value || ""
            );


        return text.length
            ? text.charAt(0).toUpperCase() +
            text.slice(1)
            : "";
    }


    // =========================================================
    // JSON
    // =========================================================

    async function readJson(
        response
    ) {

        const raw =
            await response.text();


        if (!raw)
            return {};


        try {

            return JSON.parse(
                raw
            );

        }
        catch {

            throw new Error(
                "The IGQC API returned invalid JSON."
            );
        }
    }


    // =========================================================
    // MESSAGE
    // =========================================================

    function showMessage(
        id,
        message,
        type
    ) {

        const element =
            $(id);


        if (!element)
            return;


        element.textContent =
            message || "";


        element.className =
            `${id === "searchMessage"
                ? "search-result-message"
                : "message"
            } ${type || "info"}`;


        element.classList.remove(
            "hidden"
        );
    }


    function hideMessage(
        id
    ) {

        $(id)
            ?.classList.add(
                "hidden"
            );
    }


    // =========================================================
    // DECISION MESSAGE
    // =========================================================

    function decisionMessage(
        message,
        type
    ) {

        const element =
            $("decisionMessage");


        if (!element)
            return;


        element.textContent =
            message || "";


        element.className =
            `decision-message ${type || "success"}`;


        element.classList.remove(
            "hidden"
        );
    }


    function hideDecisionMessage() {

        $("decisionMessage")
            ?.classList.add(
                "hidden"
            );
    }

})();