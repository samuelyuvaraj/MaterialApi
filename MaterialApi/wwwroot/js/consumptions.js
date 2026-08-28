/*
 * =========================================================
 * BDL MES - IGQC / MATERIAL INFORMATION
 * consumptions.js
 *
 * FLOW:
 * 01. Read R1 QR
 * 02. Display QR information
 * 03. Confirm material
 * 04. Fetch existing Consumption record
 * 05. Display quantity information
 * 06. Show ASSIGN TEST button
 * 07. Carry record to igqc-testing.html
 *
 * IMPORTANT:
 * No testing/grade logic belongs on this page.
 * Testing is handled by igqc-testing.html.
 * =========================================================
 */

document.addEventListener("DOMContentLoaded", function () {

    console.log("IGQC consumption.js loaded.");

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const qrInput =
        document.getElementById("consumptionQrInput");

    const qrReadButton =
        document.getElementById("consumptionQrRead");

    const qrClearButton =
        document.getElementById("consumptionQrClear");

    const qrMessage =
        document.getElementById("qrMessage");

    const confirmButton =
        document.getElementById("confirmConsumption");


    /* =====================================================
       MATERIAL INFORMATION
       ===================================================== */

    const infoPo =
        document.getElementById("infoPo");

    const infoSo =
        document.getElementById("infoSo");

    const infoMaterialId =
        document.getElementById("infoMaterialId");

    const infoGrn =
        document.getElementById("infoGrn");

    const infoMaterialName =
        document.getElementById("infoMaterialName");

    const infoUom =
        document.getElementById("infoUom");

    const infoStatus =
        document.getElementById("infoStatus");

    const infoReceived =
        document.getElementById("infoReceived");

    const infoAvailable =
        document.getElementById("infoAvailable");

    const infoConsumed =
        document.getElementById("infoConsumed");


    /* =====================================================
       ASSIGN TEST BUTTON
       ===================================================== */

    const assignTestingButton =
        document.getElementById("assignTestingButton");


    /* =====================================================
       CURRENT DATA
       ===================================================== */

    let currentQrData = null;

    let currentConsumptionRecord = null;


    /* =====================================================
       SAFE TEXT SETTER
       ===================================================== */

    function setText(element, value) {

        if (!element) {
            return;
        }

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            element.textContent = "-";
            return;
        }

        element.textContent = String(value);
    }


    /* =====================================================
       NUMBER FORMAT
       ===================================================== */

    function formatNumber(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return value ?? "-";
        }

        if (Number.isInteger(number)) {
            return String(number);
        }

        return number.toString();
    }


    /* =====================================================
       RECORD VALUE HELPER
       ===================================================== */

    function getRecordValue(
        record,
        camelName,
        pascalName
    ) {

        return (
            record?.[camelName] ??
            record?.[pascalName] ??
            "-"
        );
    }


    /* =====================================================
       MESSAGE
       ===================================================== */

    function showMessage(
        message,
        type = "success"
    ) {

        if (!qrMessage) {
            return;
        }

        qrMessage.textContent =
            message;

        qrMessage.classList.remove(
            "hidden",
            "success",
            "error"
        );

        qrMessage.classList.add(
            type === "error"
                ? "error"
                : "success"
        );
    }


    function hideMessage() {

        if (!qrMessage) {
            return;
        }

        qrMessage.textContent = "";

        qrMessage.classList.add(
            "hidden"
        );

        qrMessage.classList.remove(
            "success",
            "error"
        );
    }


    /* =====================================================
       RESET MATERIAL INFORMATION
       ===================================================== */

    function resetMaterialInformation() {

        setText(infoPo, "-");
        setText(infoSo, "-");
        setText(infoMaterialId, "-");
        setText(infoGrn, "-");
        setText(infoMaterialName, "-");

        setText(infoUom, "-");
        setText(infoStatus, "-");

        setText(infoReceived, "-");
        setText(infoAvailable, "-");
        setText(infoConsumed, "-");

        if (assignTestingButton) {

            assignTestingButton.disabled =
                true;
        }
    }


    /* =====================================================
       PARSE QR
       ===================================================== */

    function parseQrData(rawValue) {

        const parts =
            rawValue
                .trim()
                .split("|");

        if (parts.length < 6) {

            throw new Error(
                "Invalid QR format. Expected R1|PO|SO|ID|Material Name|GRN."
            );
        }

        const version =
            parts[0].trim();

        if (
            version.toUpperCase() !== "R1" &&
            version.toUpperCase() !== "V1"
        ) {

            throw new Error(
                "Invalid QR version: " +
                version
            );
        }

        const po =
            parts[1].trim();

        const so =
            parts[2].trim();

        const id =
            parts[3].trim();

        const materialName =
            parts[4].trim();

        const grn =
            parts[parts.length - 1].trim();


        if (!po) {
            throw new Error(
                "PO is missing from QR."
            );
        }

        if (!so) {
            throw new Error(
                "SO is missing from QR."
            );
        }

        if (!id) {
            throw new Error(
                "Material Identifier is missing from QR."
            );
        }

        if (!materialName) {
            throw new Error(
                "Material Name is missing from QR."
            );
        }

        if (!grn) {
            throw new Error(
                "GRN is missing from QR."
            );
        }


        return {

            version: version,

            po: po,

            so: so,

            id: id,

            mn: materialName,

            grn: grn
        };
    }


    /* =====================================================
       DISPLAY QR INFORMATION
       ===================================================== */

    function displayQrInformation(data) {

        console.log(
            "Displaying QR information:",
            data
        );

        setText(
            infoPo,
            data.po
        );

        setText(
            infoSo,
            data.so
        );

        setText(
            infoMaterialId,
            data.id
        );

        setText(
            infoGrn,
            data.grn
        );

        setText(
            infoMaterialName,
            data.mn
        );

        /*
         * These values come from Consumption.xlsx
         * only after CONFIRM.
         */

        setText(infoUom, "-");
        setText(infoStatus, "-");

        setText(infoReceived, "-");
        setText(infoAvailable, "-");
        setText(infoConsumed, "-");
    }


    /* =====================================================
       DISPLAY CONSUMPTION RECORD
       ===================================================== */

    function displayConsumptionRecord(record) {

        console.log(
            "Displaying consumption record:",
            record
        );


        const po =
            getRecordValue(
                record,
                "poNumber",
                "PoNumber"
            );

        const so =
            getRecordValue(
                record,
                "soNumber",
                "SoNumber"
            );

        const materialId =
            getRecordValue(
                record,
                "materialIdentifier",
                "MaterialIdentifier"
            );

        const grn =
            getRecordValue(
                record,
                "receiptId",
                "ReceiptId"
            );

        const materialName =
            getRecordValue(
                record,
                "materialName",
                "MaterialName"
            );

        const uom =
            getRecordValue(
                record,
                "unitOfMeasure",
                "UnitOfMeasure"
            );

        const status =
            getRecordValue(
                record,
                "status",
                "Status"
            );

        const received =
            getRecordValue(
                record,
                "receivedQuantity",
                "ReceivedQuantity"
            );

        const available =
            getRecordValue(
                record,
                "availableQuantity",
                "AvailableQuantity"
            );

        const consumed =
            getRecordValue(
                record,
                "consumedQuantity",
                "ConsumedQuantity"
            );


        setText(infoPo, po);

        setText(infoSo, so);

        setText(
            infoMaterialId,
            materialId
        );

        setText(infoGrn, grn);

        setText(
            infoMaterialName,
            materialName
        );

        setText(
            infoUom,
            uom
        );

        setText(
            infoStatus,
            status
        );

        setText(
            infoReceived,
            formatNumber(received)
        );

        setText(
            infoAvailable,
            formatNumber(available)
        );

        setText(
            infoConsumed,
            formatNumber(consumed)
        );


        /*
         * Consumption record is now ready.
         */

        currentConsumptionRecord =
            record;


        /*
         * Enable ASSIGN TEST.
         */

        if (assignTestingButton) {

            assignTestingButton.disabled =
                false;

            console.log(
                "ASSIGN TEST button enabled."
            );
        }


        console.log(
            "Material Information populated successfully."
        );
    }


    /* =====================================================
       READ QR
       ===================================================== */

    async function readQr() {

        console.log(
            "READ QR clicked."
        );

        hideMessage();

        const rawValue =
            qrInput
                ? qrInput.value.trim()
                : "";


        if (!rawValue) {

            showMessage(
                "Please scan or enter the material QR.",
                "error"
            );

            return;
        }


        try {

            const parsed =
                parseQrData(
                    rawValue
                );


            console.log(
                "QR successfully parsed:",
                parsed
            );


            currentQrData =
                parsed;

            currentConsumptionRecord =
                null;


            /*
             * Show QR information.
             */

            displayQrInformation(
                parsed
            );


            /*
             * Confirm is now available.
             */

            if (confirmButton) {

                confirmButton.disabled =
                    false;
            }


            /*
             * Assign Test must remain
             * disabled until Consumption
             * record is confirmed.
             */

            if (assignTestingButton) {

                assignTestingButton.disabled =
                    true;
            }


            showMessage(
                "QR code successfully identified.",
                "success"
            );


        }
        catch (error) {

            console.error(
                "QR parsing error:",
                error
            );

            currentQrData =
                null;

            currentConsumptionRecord =
                null;


            resetMaterialInformation();


            if (confirmButton) {

                confirmButton.disabled =
                    true;
            }


            showMessage(
                error.message ||
                "Invalid QR code.",
                "error"
            );
        }
    }


    /* =====================================================
       CONFIRM MATERIAL
       ===================================================== */

    async function confirmMaterial() {

        console.log(
            "================================="
        );

        console.log(
            "CONFIRM MATERIAL CLICKED"
        );

        console.log(
            "================================="
        );


        if (!currentQrData) {

            showMessage(
                "Please read the QR code first.",
                "error"
            );

            return;
        }


        /*
         * KEEPING THE EXISTING API CONTRACT.
         *
         * DO NOT CHANGE THIS TO qrData.
         */

        const payload = {

            po:
                String(
                    currentQrData.po || ""
                ).trim(),

            so:
                String(
                    currentQrData.so || ""
                ).trim(),

            id:
                String(
                    currentQrData.id || ""
                ).trim(),

            grn:
                String(
                    currentQrData.grn || ""
                ).trim()
        };


        console.log(
            "Fetching consumption record with:",
            payload
        );


        if (confirmButton) {

            confirmButton.disabled =
                true;
        }


        const originalText =
            confirmButton
                ? confirmButton.innerHTML
                : "";


        if (confirmButton) {

            confirmButton.innerHTML =
                "LOADING...";
        }


        try {

            /*
             * EXISTING CONSUMPTION API.
             *
             * DO NOT CHANGE.
             */

            const response =
                await fetch(
                    "/api/consumption/confirm",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            console.log(
                "Consumption API status:",
                response.status
            );


            const raw =
                await response.text();


            console.log(
                "Consumption API raw response:",
                raw
            );


            let data;


            try {

                data =
                    raw
                        ? JSON.parse(raw)
                        : null;

            }
            catch (jsonError) {

                throw new Error(
                    "Consumption API returned invalid JSON."
                );
            }


            console.log(
                "Consumption API response:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Failed to fetch consumption record."
                );
            }


            if (
                data &&
                data.success === false
            ) {

                throw new Error(
                    data.message ||
                    "No related consumption record found."
                );
            }


            /*
             * Existing API response:
             *
             * {
             *   success: true,
             *   consumption: {...}
             * }
             */

            let record =
                data?.consumption ||
                data?.record ||
                data?.data;


            /*
             * Support direct record response.
             */

            if (
                !record &&
                data
            ) {

                if (
                    data.poNumber ||
                    data.PoNumber ||
                    data.po
                ) {

                    record =
                        data;
                }
            }


            /*
             * Array protection.
             */

            if (
                Array.isArray(record)
            ) {

                record =
                    record.length > 0
                        ? record[0]
                        : null;
            }


            if (!record) {

                throw new Error(
                    data?.message ||
                    "No related consumption record found."
                );
            }


            /*
             * Validate returned record.
             */

            const poNumber =
                record.poNumber ??
                record.PoNumber ??
                record.po;

            const soNumber =
                record.soNumber ??
                record.SoNumber ??
                record.so;

            const materialIdentifier =
                record.materialIdentifier ??
                record.MaterialIdentifier ??
                record.id;

            const receiptId =
                record.receiptId ??
                record.ReceiptId ??
                record.grn;


            if (
                !poNumber ||
                !soNumber ||
                !materialIdentifier ||
                !receiptId
            ) {

                console.error(
                    "Invalid consumption record:",
                    record
                );

                throw new Error(
                    "Consumption API returned incomplete material data."
                );
            }


            /*
             * Store complete record.
             */

            currentConsumptionRecord =
                record;


            console.log(
                "CONSUMPTION RECORD FOUND"
            );

            console.log(
                currentConsumptionRecord
            );


            /*
             * Display:
             *
             * PO
             * SO
             * Material ID
             * GRN
             * Material Name
             * UOM
             * Status
             * Received
             * Available
             * Consumed
             */

            displayConsumptionRecord(
                record
            );


            /*
             * Enable ASSIGN TEST.
             */

            const assignButton = document.getElementById("assignTestingButton");

            if (assignButton) {
                assignButton.classList.remove("hidden");
                assignButton.style.display = "inline-flex";
                assignButton.disabled = false;

                console.log("ASSIGN TEST button shown.");
            } else {
                console.error("assignTestingButton not found in HTML.");
            }


            showMessage(
                "Consumption record successfully loaded.",
                "success"
            );


        }
        catch (error) {

            console.error(
                "Consumption fetch error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to fetch consumption record.",
                "error"
            );


            if (assignTestingButton) {

                assignTestingButton.disabled =
                    true;
            }
        }
        finally {

            if (confirmButton) {

                confirmButton.disabled =
                    false;

                confirmButton.innerHTML =
                    originalText;
            }
        }
    }


    /* =====================================================
       ASSIGN TEST
       ===================================================== */

    function assignTest() {

        console.log(
            "ASSIGN TEST clicked."
        );


        if (!currentConsumptionRecord) {

            showMessage(
                "Please confirm the material first.",
                "error"
            );

            return;
        }


        /*
         * Carry the COMPLETE consumption record
         * to the next page.
         */

        const transferData = {

            po:
                getRecordValue(
                    currentConsumptionRecord,
                    "poNumber",
                    "PoNumber"
                ),

            so:
                getRecordValue(
                    currentConsumptionRecord,
                    "soNumber",
                    "SoNumber"
                ),

            materialIdentifier:
                getRecordValue(
                    currentConsumptionRecord,
                    "materialIdentifier",
                    "MaterialIdentifier"
                ),

            grn:
                getRecordValue(
                    currentConsumptionRecord,
                    "receiptId",
                    "ReceiptId"
                ),

            materialName:
                getRecordValue(
                    currentConsumptionRecord,
                    "materialName",
                    "MaterialName"
                ),

            unitOfMeasure:
                getRecordValue(
                    currentConsumptionRecord,
                    "unitOfMeasure",
                    "UnitOfMeasure"
                ),

            status:
                getRecordValue(
                    currentConsumptionRecord,
                    "status",
                    "Status"
                ),

            receivedQuantity:
                getRecordValue(
                    currentConsumptionRecord,
                    "receivedQuantity",
                    "ReceivedQuantity"
                ),

            availableQuantity:
                getRecordValue(
                    currentConsumptionRecord,
                    "availableQuantity",
                    "AvailableQuantity"
                ),

            consumedQuantity:
                getRecordValue(
                    currentConsumptionRecord,
                    "consumedQuantity",
                    "ConsumedQuantity"
                )
        };


        /*
         * Store for igqc-testing.html.
         */

        sessionStorage.setItem(
            "igqcTestingMaterial",
            JSON.stringify(
                transferData
            )
        );


        console.log(
            "Data transferred to IGQC Testing:",
            transferData
        );


        /*
         * Navigate to testing page.
         */

        window.location.href =
            "/igqc-testing.html";
    }


    /* =====================================================
       CLEAR EVERYTHING
       ===================================================== */

    function clearAll() {

        console.log(
            "CLEAR clicked."
        );


        if (qrInput) {

            qrInput.value = "";
        }


        currentQrData =
            null;

        currentConsumptionRecord =
            null;


        resetMaterialInformation();


        if (confirmButton) {

            confirmButton.disabled =
                true;
        }


        hideMessage();


        if (qrInput) {

            qrInput.focus();
        }
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    if (qrReadButton) {

        qrReadButton.addEventListener(
            "click",
            readQr
        );
    }


    if (confirmButton) {

        confirmButton.addEventListener(
            "click",
            confirmMaterial
        );
    }


    if (qrClearButton) {

        qrClearButton.addEventListener(
            "click",
            clearAll
        );
    }


    if (assignTestingButton) {

        assignTestingButton.addEventListener(
            "click",
            assignTest
        );
    }


    /*
     * Scanner often sends ENTER.
     */

    if (qrInput) {

        qrInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    readQr();
                }
            }
        );
    }


    /* =====================================================
       INITIAL STATE
       ===================================================== */

    resetMaterialInformation();


    if (confirmButton) {

        confirmButton.disabled =
            true;
    }


    if (qrInput) {

        qrInput.focus();
    }


    console.log(
        "IGQC consumption module initialized."
    );
});