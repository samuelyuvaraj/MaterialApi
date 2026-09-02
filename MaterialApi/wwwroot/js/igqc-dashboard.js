/*
 * =========================================================
 * BDL MES - IGQC OFFLINE DASHBOARD
 * =========================================================
 */

(() => {

    "use strict";

    const API_URL =
        "/api/igqc/dashboard";

    let records = [];

    const $ = (id) =>
        document.getElementById(id);

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

    function initialize() {

        $("refreshButton")
            ?.addEventListener(
                "click",
                loadDashboard
            );

        $("recordSearch")
            ?.addEventListener(
                "input",
                renderTable
            );

        $("decisionFilter")
            ?.addEventListener(
                "change",
                renderTable
            );

        loadDashboard();
    }

    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async function loadDashboard() {

        setMessage(
            "Loading IGQC dashboard...",
            "info"
        );

        try {

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "GET",
                        headers: {
                            "Accept":
                                "application/json"
                        },
                        cache: "no-store"
                    }
                );

            const text =
                await response.text();

            let data = {};

            if (text) {

                try {
                    data =
                        JSON.parse(text);
                }
                catch {
                    throw new Error(
                        "IGQC Dashboard API returned invalid JSON."
                    );
                }
            }

            if (
                !response.ok ||
                data.success === false
            ) {
                throw new Error(
                    data.message ||
                    `IGQC Dashboard API returned HTTP ${response.status}.`
                );
            }

            records =
                Array.isArray(
                    data.records
                )
                    ? data.records
                    : [];

            const summary =
                data.summary ||
                buildSummary(records);

            renderSummary(summary);
            renderTable();
            renderVendorReport(records);

            hideMessage();

        }
        catch (error) {

            console.error(
                "IGQC Dashboard load error:",
                error
            );

            records = [];

            renderSummary(
                buildSummary([])
            );

            renderTable();
            renderVendorReport([]);

            setMessage(
                error.message ||
                "Unable to load IGQC dashboard.",
                "error"
            );
        }
    }

    // =====================================================
    // UNIQUE RECORDS
    // =====================================================

    function uniqueRecords(source) {

        const map =
            new Map();

        for (
            const record of source
        ) {

            const id =
                normalize(
                    record.assignmentId ??
                    record.AssignmentId
                );

            if (!id) {
                continue;
            }

            map.set(
                id,
                record
            );
        }

        return Array.from(
            map.values()
        );
    }

    // =====================================================
    // SUMMARY
    // =====================================================

    function buildSummary(source) {

        const unique =
            uniqueRecords(source);

        const approved =
            unique.filter(
                x =>
                    normalize(
                        x.igqcDecision ??
                        x.IgqcDecision
                    ) === "approved"
            ).length;

        const rejected =
            unique.filter(
                x =>
                    normalize(
                        x.igqcDecision ??
                        x.IgqcDecision
                    ) === "rejected"
            ).length;

        const decided =
            approved + rejected;

        const resultStatus = {};

        unique.forEach(
            record => {

                const status =
                    displayValue(
                        record.resultStatus ??
                        record.ResultStatus
                    );

                if (
                    status !== "-"
                ) {
                    resultStatus[status] =
                        (
                            resultStatus[status] ||
                            0
                        ) + 1;
                }
            }
        );

        return {
            total:
                unique.length,

            approved,

            rejected,

            approvalRate:
                decided === 0
                    ? 0
                    : (
                        approved /
                        decided
                    ) * 100,

            resultStatus
        };
    }

    // =====================================================
    // SUMMARY UI
    // =====================================================

    function renderSummary(summary) {

        const total =
            Number(summary.total) || 0;

        const approved =
            Number(summary.approved) || 0;

        const rejected =
            Number(summary.rejected) || 0;

        const rate =
            Number(summary.approvalRate) || 0;

        $("totalIgqc").textContent =
            formatNumber(total);

        $("approvedIgqc").textContent =
            formatNumber(approved);

        $("rejectedIgqc").textContent =
            formatNumber(rejected);

        $("approvalRate").textContent =
            formatNumber(rate) + "%";

        $("donutTotal").textContent =
            formatNumber(total);

        renderDonut(
            approved,
            rejected,
            total
        );

        renderResultStatus(
            summary.resultStatus || {}
        );
    }

    // =====================================================
    // DONUT
    // =====================================================

    function renderDonut(
        approved,
        rejected,
        total
    ) {

        const donut =
            $("donut");

        if (!donut) {
            return;
        }

        if (total <= 0) {

            donut.style.background =
                "conic-gradient(#e8edf3 0 100%)";

        }
        else {

            const approvedPercent =
                (
                    approved /
                    total
                ) * 100;

            const rejectedPercent =
                (
                    rejected /
                    total
                ) * 100;

            const rejectedEnd =
                approvedPercent +
                rejectedPercent;

            donut.style.background =
                `conic-gradient(
                    #169447 0 ${approvedPercent}%,
                    #d93636 ${approvedPercent}% ${rejectedEnd}%,
                    #e8edf3 ${rejectedEnd}% 100%
                )`;
        }

        $("legend").innerHTML =
            legendRow(
                "Approved",
                approved,
                "#169447"
            ) +
            legendRow(
                "Rejected",
                rejected,
                "#d93636"
            );
    }

    function legendRow(
        label,
        value,
        color
    ) {

        return `
            <div class="igqc-legend-row">
                <span
                    class="igqc-legend-dot"
                    style="background:${color}">
                </span>

                <span>
                    ${escapeHtml(label)}
                </span>

                <strong class="igqc-legend-value">
                    ${formatNumber(value)}
                </strong>
            </div>
        `;
    }

    // =====================================================
    // RESULT STATUS
    // =====================================================

    function renderResultStatus(
        statusObject
    ) {

        const entries =
            Object.entries(
                statusObject
            )
                .filter(
                    ([, value]) =>
                        Number(value) > 0
                );

        const chart =
            $("statusChart");

        if (!chart) {
            return;
        }

        if (!entries.length) {

            chart.innerHTML =
                `<div class="igqc-empty">
                    No result status data available.
                </div>`;

            return;
        }

        const maximum =
            Math.max(
                ...entries.map(
                    ([, value]) =>
                        Number(value)
                ),
                1
            );

        chart.innerHTML =
            entries
                .map(
                    ([label, value]) => `

                    <div class="igqc-bar-row">

                        <div
                            class="igqc-bar-label"
                            title="${escapeHtml(label)}">
                            ${escapeHtml(label)}
                        </div>

                        <div class="igqc-bar-track">
                            <div
                                class="igqc-bar-fill"
                                style="width:${(
                            Number(value) /
                            maximum
                        ) * 100}%">
                            </div>
                        </div>

                        <div class="igqc-bar-value">
                            ${formatNumber(value)}
                        </div>

                    </div>
                `
                )
                .join("");
    }

    // =====================================================
    // VENDOR QUALITY REPORT
    // Existing dashboard logic is not changed.
    // This section only consumes vendor information returned
    // by /api/igqc/dashboard.
    // =====================================================

    function renderVendorReport(source) {

        const tableBody =
            $("vendorReportBody");

        const emptyState =
            $("vendorEmptyState");

        if (!tableBody) {
            return;
        }

        const unique =
            uniqueRecords(source);

        const vendors =
            new Map();

        unique.forEach(
            record => {

                const vendor =
                    displayValue(
                        record.vendor ??
                        record.Vendor
                    );

                const vendorKey =
                    normalize(vendor);

                if (!vendors.has(vendorKey)) {

                    vendors.set(
                        vendorKey,
                        {
                            vendor:
                                vendor === "-"
                                    ? "Vendor Not Specified"
                                    : vendor,

                            total: 0,
                            approved: 0,
                            rejected: 0,
                            latestDate: "",
                            latestTime: ""
                        }
                    );
                }

                const item =
                    vendors.get(vendorKey);

                item.total++;

                const decision =
                    normalize(
                        record.igqcDecision ??
                        record.IgqcDecision
                    );

                if (
                    decision === "approved"
                ) {
                    item.approved++;
                }
                else if (
                    decision === "rejected"
                ) {
                    item.rejected++;
                }

                const date =
                    displayValue(
                        record.decisionDate ??
                        record.DecisionDate ??
                        record.date ??
                        record.Date
                    );

                const time =
                    displayValue(
                        record.decisionTime ??
                        record.DecisionTime ??
                        record.time ??
                        record.Time
                    );

                const currentStamp =
                    `${date} ${time}`;

                const latestStamp =
                    `${item.latestDate} ${item.latestTime}`;

                if (
                    latestStamp.trim() === "" ||
                    currentStamp > latestStamp
                ) {
                    item.latestDate =
                        date === "-"
                            ? ""
                            : date;

                    item.latestTime =
                        time === "-"
                            ? ""
                            : time;
                }
            }
        );

        const entries =
            Array.from(
                vendors.values()
            )
                .sort(
                    (a, b) =>
                        b.total - a.total ||
                        a.vendor.localeCompare(b.vendor)
                );

        let totalInspected = 0;
        let totalApproved = 0;
        let totalRejected = 0;

        entries.forEach(item => {
            totalInspected += item.total;
            totalApproved += item.approved;
            totalRejected += item.rejected;
        });

        const decided =
            totalApproved +
            totalRejected;

        const overallRate =
            decided === 0
                ? 0
                : (
                    totalApproved /
                    decided
                ) * 100;

        setText(
            "vendorCount",
            entries.length
        );

        setText(
            "vendorInspected",
            totalInspected
        );

        setText(
            "vendorApproved",
            totalApproved
        );

        setText(
            "vendorRejected",
            totalRejected
        );

        setText(
            "vendorQualityRate",
            formatNumber(overallRate) + "%"
        );

        tableBody.innerHTML = "";

        if (!entries.length) {

            emptyState
                ?.classList.remove(
                    "igqc-hidden"
                );

            return;
        }

        emptyState
            ?.classList.add(
                "igqc-hidden"
            );

        entries.forEach(
            item => {

                const itemDecided =
                    item.approved +
                    item.rejected;

                const approvalRate =
                    itemDecided === 0
                        ? 0
                        : (
                            item.approved /
                            itemDecided
                        ) * 100;

                const rejectionRate =
                    itemDecided === 0
                        ? 0
                        : (
                            item.rejected /
                            itemDecided
                        ) * 100;

                const latestInspection =
                    item.latestDate
                        ? `${item.latestDate} ${item.latestTime}`
                        : "-";

                const tr =
                    document.createElement("tr");

                tr.innerHTML = `
                    <td class="igqc-vendor-name">
                        ${escapeHtml(item.vendor)}
                    </td>

                    <td class="igqc-vendor-number">
                        ${formatNumber(item.total)}
                    </td>

                    <td>
                        <span class="igqc-vendor-badge igqc-vendor-badge-approved">
                            ${formatNumber(item.approved)}
                        </span>
                    </td>

                    <td>
                        <span class="igqc-vendor-badge igqc-vendor-badge-rejected">
                            ${formatNumber(item.rejected)}
                        </span>
                    </td>

                    <td class="igqc-vendor-rate ${rateClass(approvalRate)}">
                        ${formatNumber(approvalRate)}%
                    </td>

                    <td class="igqc-vendor-rate ${rateClass(rejectionRate, true)}">
                        ${formatNumber(rejectionRate)}%
                    </td>

                    <td class="igqc-vendor-last">
                        ${escapeHtml(latestInspection)}
                    </td>
                `;

                tableBody.appendChild(tr);
            }
        );
    }

    // =====================================================
    // TABLE
    // =====================================================

    function renderTable() {

        const query =
            normalize(
                $("recordSearch")?.value
            );

        const decision =
            normalize(
                $("decisionFilter")?.value
            );

        const filtered =
            uniqueRecords(records)
                .filter(
                    record => {

                        const searchable = [

                            record.assignmentId ??
                            record.AssignmentId,

                            record.date ??
                            record.Date,

                            record.po ??
                            record.Po,

                            record.so ??
                            record.So,

                            record.materialId ??
                            record.MaterialId,

                            record.materialName ??
                            record.MaterialName,

                            record.vendor ??
                            record.Vendor,

                            record.grn ??
                            record.Grn,

                            record.resultStatus ??
                            record.ResultStatus,

                            record.igqcDecision ??
                            record.IgqcDecision

                        ]
                            .map(normalize)
                            .join(" ");

                        const queryMatches =
                            !query ||
                            searchable.includes(
                                query
                            );

                        const decisionMatches =
                            !decision ||
                            normalize(
                                record.igqcDecision ??
                                record.IgqcDecision
                            ) === decision;

                        return (
                            queryMatches &&
                            decisionMatches
                        );
                    }
                )
                .sort(
                    sortNewestFirst
                );

        const body =
            $("recordsBody");

        if (!body) {
            return;
        }

        body.innerHTML =
            filtered
                .map(
                    record => `

                        <tr>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.assignmentId ??
                            record.AssignmentId
                        )
                    )}
                            </td>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.date ??
                            record.Date
                        )
                    )}
                            </td>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.po ??
                            record.Po
                        )
                    )}
                            </td>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.so ??
                            record.So
                        )
                    )}
                            </td>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.materialName ??
                            record.MaterialName ??
                            record.materialId ??
                            record.MaterialId
                        )
                    )}
                            </td>

                            <td>
                                <strong>
                                    ${escapeHtml(
                        displayValue(
                            record.vendor ??
                            record.Vendor
                        )
                    )}
                                </strong>
                            </td>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.grn ??
                            record.Grn
                        )
                    )}
                            </td>

                            <td>
                                ${resultBadge(
                        record.resultStatus ??
                        record.ResultStatus
                    )}
                            </td>

                            <td>
                                ${decisionBadge(
                        record.igqcDecision ??
                        record.IgqcDecision
                    )}
                            </td>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.decisionDate ??
                            record.DecisionDate
                        )
                    )}
                            </td>

                            <td>
                                ${escapeHtml(
                        displayValue(
                            record.decisionTime ??
                            record.DecisionTime
                        )
                    )}
                            </td>

                        </tr>
                    `
                )
                .join("");

        $("emptyState")
            ?.classList.toggle(
                "igqc-hidden",
                filtered.length > 0
            );
    }

    // =====================================================
    // SORT
    // =====================================================

    function sortNewestFirst(
        a,
        b
    ) {

        const left = [

            displayValue(
                a.decisionDate ??
                a.DecisionDate
            ),

            displayValue(
                a.decisionTime ??
                a.DecisionTime
            ),

            displayValue(
                a.date ??
                a.Date
            ),

            displayValue(
                a.time ??
                a.Time
            )

        ].join(" ");

        const right = [

            displayValue(
                b.decisionDate ??
                b.DecisionDate
            ),

            displayValue(
                b.decisionTime ??
                b.DecisionTime
            ),

            displayValue(
                b.date ??
                b.Date
            ),

            displayValue(
                b.time ??
                b.Time
            )

        ].join(" ");

        return right.localeCompare(
            left
        );
    }

    // =====================================================
    // BADGES
    // =====================================================

    function decisionBadge(value) {

        const normalized =
            normalize(value);

        let className =
            "igqc-badge-pending";

        if (
            normalized === "approved"
        ) {
            className =
                "igqc-badge-approved";
        }
        else if (
            normalized === "rejected"
        ) {
            className =
                "igqc-badge-rejected";
        }

        return `
            <span
                class="igqc-badge ${className}">
                ${escapeHtml(
            displayValue(value)
        )}
            </span>
        `;
    }

    function resultBadge(value) {

        const normalized =
            normalize(value);

        let className =
            "igqc-badge-other";

        if (
            normalized === "completed"
        ) {
            className =
                "igqc-badge-completed";
        }
        else if (
            normalized === "pending"
        ) {
            className =
                "igqc-badge-pending";
        }

        return `
            <span
                class="igqc-badge ${className}">
                ${escapeHtml(
            displayValue(value)
        )}
            </span>
        `;
    }

    // =====================================================
    // MESSAGE
    // =====================================================

    function setMessage(
        message,
        type
    ) {

        const element =
            $("message");

        if (!element) {
            return;
        }

        element.textContent =
            message || "";

        element.className =
            `igqc-message igqc-${type || "info"}`;

        element.classList.remove(
            "igqc-hidden"
        );
    }

    function hideMessage() {

        $("message")
            ?.classList.add(
                "igqc-hidden"
            );
    }

    // =====================================================
    // HELPERS
    // =====================================================

    function setText(id, value) {

        const element =
            $(id);

        if (element) {
            element.textContent =
                String(value);
        }
    }

    function rateClass(
        rate,
        rejection = false
    ) {

        if (rejection) {

            if (rate === 0) {
                return "igqc-vendor-rate-good";
            }

            if (rate < 20) {
                return "igqc-vendor-rate-warning";
            }

            return "igqc-vendor-rate-bad";
        }

        if (rate >= 90) {
            return "igqc-vendor-rate-good";
        }

        if (rate >= 70) {
            return "igqc-vendor-rate-warning";
        }

        return "igqc-vendor-rate-bad";
    }

    function formatNumber(value) {

        const number =
            Number(value);

        if (
            !Number.isFinite(number)
        ) {
            return "0";
        }

        return Number.isInteger(
            number
        )
            ? String(number)
            : number.toFixed(1);
    }

    function displayValue(value) {

        return (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        )
            ? "-"
            : String(value).trim();
    }

    function normalize(value) {

        return (
            value === null ||
            value === undefined
        )
            ? ""
            : String(value)
                .trim()
                .toLowerCase();
    }

    function escapeHtml(value) {

        return String(value)

            .replaceAll(
                "&",
                "&amp;"
            )

            .replaceAll(
                "<",
                "&lt;"
            )

            .replaceAll(
                ">",
                "&gt;"
            )

            .replaceAll(
                '"',
                "&quot;"
            )

            .replaceAll(
                "'",
                "&#039;"
            );
    }

})();
