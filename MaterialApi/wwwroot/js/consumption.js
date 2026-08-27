/* =========================================================
   BDL MES - MATERIAL CONSUMPTION
   QR -> Confirm -> Excel Fetch

   CURRENT STAGE ONLY:

   READ QR
       |
       v
   Parse QR
       |
       v
   Show QR data
       |
       v
   CONFIRM
       |
       v
   Fetch Consumption.xlsx
       |
       v
   Show complete Excel record

   NO CONSUMPTION UPDATE YET.
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    function () {


        /* =====================================================
           ELEMENTS
           ===================================================== */

        const qrInput =
            document.getElementById(
                "consumptionQrInput"
            );

        const readButton =
            document.getElementById(
                "consumptionQrRead"
            );

        const clearButton =
            document.getElementById(
                "consumptionQrClear"
            );

        const qrMessage =
            document.getElementById(
                "qrMessage"
            );

        const qrResultPanel =
            document.getElementById(
                "qrResultPanel"
            );

        const confirmButton =
            document.getElementById(
                "confirmConsumption"
            );

        const materialResultPanel =
            document.getElementById(
                "materialResultPanel"
            );


        /* =====================================================
           QR DISPLAY FIELDS
           ===================================================== */

        const qrPo =
            document.getElementById(
                "qrPo"
            );

        const qrSo =
            document.getElementById(
                "qrSo"
            );

        const qrId =
            document.getElementById(
                "qrId"
            );

        const qrMaterialName =
            document.getElementById(
                "qrMaterialName"
            );

        const qrGrn =
            document.getElementById(
                "qrGrn"
            );


        /* =====================================================
           EXCEL RESULT FIELDS
           ===================================================== */

        const materialPo =
            document.getElementById(
                "materialPo"
            );

        const materialSo =
            document.getElementById(
                "materialSo"
            );

        const materialId =
            document.getElementById(
                "materialId"
            );

        const materialName =
            document.getElementById(
                "materialName"
            );

        const materialGrn =
            document.getElementById(
                "materialGrn"
            );

        const materialUom =
            document.getElementById(
                "materialUom"
            );

        const materialStatus =
            document.getElementById(
                "materialStatus"
            );

        const materialLastUpdated =
            document.getElementById(
                "materialLastUpdated"
            );


        const receivedQuantity =
            document.getElementById(
                "receivedQuantity"
            );

        const availableQuantity =
            document.getElementById(
                "availableQuantity"
            );

        const consumedQuantity =
            document.getElementById(
                "consumedQuantity"
            );


        /* =====================================================
           STATE
           ===================================================== */

        let scannedQr = null;

        let consumptionRecord = null;


        /* =====================================================
           STARTUP CHECK
           ===================================================== */

        console.log(
            "=========================================="
        );

        console.log(
            "Material Consumption module loaded."
        );

        console.log(
            "QR input:",
            qrInput
        );

        console.log(
            "READ button:",
            readButton
        );

        console.log(
            "CONFIRM button:",
            confirmButton
        );

        console.log(
            "QR result panel:",
            qrResultPanel
        );

        console.log(
            "Excel result panel:",
            materialResultPanel
        );

        console.log(
            "=========================================="
        );


        if (!qrInput ||
            !readButton ||
            !confirmButton ||
            !qrResultPanel ||
            !materialResultPanel) {

            console.error(
                "Required Material Consumption HTML elements are missing."
            );

            return;
        }


        /* =====================================================
           MESSAGE
           ===================================================== */

        function showQrMessage(
            message,
            isError = false
        ) {

            if (!qrMessage) {
                console.log(
                    message
                );

                return;
            }


            qrMessage.textContent =
                message;


            qrMessage.classList.remove(
                "hidden"
            );


            qrMessage.classList.remove(
                "error"
            );


            qrMessage.classList.remove(
                "success"
            );


            if (isError) {

                qrMessage.classList.add(
                    "error"
                );

            }
            else {

                qrMessage.classList.add(
                    "success"
                );

            }

        }


        /* =====================================================
           SET TEXT SAFELY
           ===================================================== */

        function setText(
            element,
            value
        ) {

            if (!element) {
                return;
            }


            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                element.textContent =
                    "-";

                return;
            }


            element.textContent =
                String(value);
        }


        /* =====================================================
           NUMBER FORMAT
           ===================================================== */

        function formatNumber(
            value
        ) {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                return "0";
            }


            const number =
                Number(value);


            if (!Number.isFinite(number)) {

                return String(value);
            }


            return number.toLocaleString(
                "en-IN",
                {
                    maximumFractionDigits: 6
                }
            );
        }


        /* =====================================================
           DATE FORMAT
           ===================================================== */

        function formatDate(
            value
        ) {

            if (
                value === null ||
                value === undefined ||
                value === ""
            ) {

                return "-";
            }


            const date =
                new Date(value);


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return String(value);
            }


            /*
             * .NET DateTime.MinValue
             *
             * 0001-01-01
             *
             * Treat this as no date.
             */

            if (
                date.getFullYear() <= 1
            ) {

                return "-";
            }


            return date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                }
            );
        }


        /* =====================================================
           PARSE QR
           
           FORMAT:

           R1|PO|SO|ID|MN|GRN

           Example:

           R1|
           PO202608210000000001|
           SO202608210000000001|
           ID202608210001|
           Titanium|
           GRN-000001
           ===================================================== */

        function parseQrData(
            qrData
        ) {
            console.log(
                "========== CONSUMPTION JS VERSION =========="
            );

            console.log(
                "EXPECTED QR VERSION: R1"
            );

            console.log(
                "JS FILE LOADED AT:",
                new Date().toISOString()
            );

            console.log(
                "============================================="
            );

            if (!qrData) {

                throw new Error(
                    "QR data is empty."
                );
            }


            const parts =
                qrData
                    .trim()
                    .split("|");


            console.log(
                "QR parts:",
                parts
            );


            /*
             * Current R1 requires exactly
             * six fields.
             */

            if (parts.length !== 6) {

                throw new Error(
                    "Invalid QR format. Expected R1|PO|SO|ID|MN|GRN."
                );
            }


            const version =
                parts[0].trim();


            if (
                version.toUpperCase() !==
                "R1"
            ) {

                throw new Error(
                    "Unsupported QR version: " +
                    version
                );
            }


            const po =
                parts[1].trim();

            const so =
                parts[2].trim();

            const id =
                parts[3].trim();

            /*
             * DO NOT truncate material name.
             *
             * It can contain 350+
             * characters.
             */

            const mn =
                parts[4];

            const grn =
                parts[5].trim();


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


            if (!mn.trim()) {

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

                version: "R1",

                po: po,

                so: so,

                id: id,

                mn: mn,

                grn: grn

            };
        }


        /* =====================================================
           SHOW QR DATA
           ===================================================== */

        function displayQrData(
            qr
        ) {

            console.log(
                "Displaying QR data:",
                qr
            );


            setText(
                qrPo,
                qr.po
            );


            setText(
                qrSo,
                qr.so
            );


            setText(
                qrId,
                qr.id
            );


            setText(
                qrMaterialName,
                qr.mn
            );


            setText(
                qrGrn,
                qr.grn
            );


            /*
             * Show STEP 02.
             */

            qrResultPanel.classList.remove(
                "hidden"
            );


            /*
             * CONFIRM becomes available.
             */

            confirmButton.disabled =
                false;


            /*
             * Make sure previous Excel
             * result is hidden.
             */

            materialResultPanel.classList.add(
                "hidden"
            );


            consumptionRecord =
                null;

        }


        /* =====================================================
           READ QR

           IMPORTANT:

           THIS DOES NOT CALL THE API.

           It ONLY:
             1. reads input
             2. splits QR
             3. validates QR
             4. shows QR fields
           ===================================================== */

        function readQr() {

            const qrData =
                qrInput.value.trim();


            if (!qrData) {

                showQrMessage(
                    "Please scan or enter QR data.",
                    true
                );

                return;
            }


            try {

                const parsed =
                    parseQrData(
                        qrData
                    );


                scannedQr =
                    parsed;


                console.log(
                    "QR successfully parsed:",
                    parsed
                );


                /*
                 * Show QR information.
                 */

                displayQrData(
                    parsed
                );


                /*
                 * IMPORTANT:
                 *
                 * No Excel API call here.
                 */

                showQrMessage(
                    "QR code successfully identified."
                );

            }
            catch (error) {

                console.error(
                    "QR parsing error:",
                    error
                );


                scannedQr =
                    null;


                consumptionRecord =
                    null;


                confirmButton.disabled =
                    true;


                qrResultPanel.classList.add(
                    "hidden"
                );


                materialResultPanel.classList.add(
                    "hidden"
                );


                showQrMessage(
                    error.message ||
                    "Invalid QR code.",
                    true
                );
            }

        }


        /* =====================================================
           CONFIRM

           THIS IS THE ONLY PLACE WHERE
           EXCEL DATA IS FETCHED.
           ===================================================== */

        async function confirmConsumption() {

            if (!scannedQr) {

                showQrMessage(
                    "Please read a valid QR code first.",
                    true
                );

                return;
            }


            console.log(
                "=========================================="
            );

            console.log(
                "CONFIRM CLICKED"
            );

            console.log(
                "Sending QR fields to Excel lookup:"
            );

            console.log(
                "PO:",
                scannedQr.po
            );

            console.log(
                "SO:",
                scannedQr.so
            );

            console.log(
                "ID:",
                scannedQr.id
            );

            console.log(
                "GRN:",
                scannedQr.grn
            );

            console.log(
                "=========================================="
            );


            confirmButton.disabled =
                true;


            const originalText =
                confirmButton.innerHTML;


            confirmButton.textContent =
                "LOADING...";


            showQrMessage(
                "Fetching related consumption record..."
            );


            try {

                /*
                 * ONLY NOW call the backend.
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
                                    {
                                        po:
                                            scannedQr.po,

                                        so:
                                            scannedQr.so,

                                        id:
                                            scannedQr.id,

                                        grn:
                                            scannedQr.grn
                                    }
                                )
                        }
                    );


                console.log(
                    "Confirm HTTP status:",
                    response.status
                );


                /*
                 * Read response safely.
                 */

                const result =
                    await response.json();


                console.log(
                    "Confirm API response:",
                    result
                );


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "No related consumption record found."
                    );
                }


                /*
                 * Get Excel record.
                 */

                const record =
                    result.consumption;


                if (!record) {

                    throw new Error(
                        "API returned success but no consumption record."
                    );
                }


                consumptionRecord =
                    record;


                console.log(
                    "Excel consumption record:",
                    record
                );


                /*
                 * Display every Excel field.
                 */

                displayConsumptionRecord(
                    record
                );


                showQrMessage(
                    "Consumption record successfully loaded."
                );


            }
            catch (error) {

                console.error(
                    "Excel fetch error:",
                    error
                );


                consumptionRecord =
                    null;


                materialResultPanel.classList.add(
                    "hidden"
                );


                showQrMessage(
                    error.message ||
                    "Unable to fetch consumption record.",
                    true
                );

            }
            finally {

                confirmButton.disabled =
                    false;


                confirmButton.innerHTML =
                    originalText;
            }

        }


        /* =====================================================
           DISPLAY EXCEL RECORD
           ===================================================== */

        function displayConsumptionRecord(
            record
        ) {

            console.log(
                "=========================================="
            );

            console.log(
                "DISPLAYING EXCEL RECORD"
            );

            console.log(
                record
            );

            console.log(
                "=========================================="
            );


            /*
             * PO
             */

            setText(
                materialPo,
                record.poNumber
            );


            /*
             * SO
             */

            setText(
                materialSo,
                record.soNumber
            );


            /*
             * Material Identifier
             */

            setText(
                materialId,
                record.materialIdentifier
            );


            /*
             * Material Name
             *
             * textContent is deliberately used.
             *
             * No HTML interpretation.
             *
             * Supports 350+ characters.
             */

            setText(
                materialName,
                record.materialName
            );


            /*
             * GRN
             */

            setText(
                materialGrn,
                record.receiptId
            );


            /*
             * UOM
             */

            setText(
                materialUom,
                record.unitOfMeasure
            );


            /*
             * STATUS
             */

            setText(
                materialStatus,
                record.status
            );


            /*
             * LAST UPDATED
             */

            setText(
                materialLastUpdated,
                formatDate(
                    record.lastUpdated
                )
            );


            /*
             * RECEIVED
             */

            setText(
                receivedQuantity,
                formatNumber(
                    record.receivedQuantity
                )
            );


            /*
             * AVAILABLE
             */

            setText(
                availableQuantity,
                formatNumber(
                    record.availableQuantity
                )
            );


            /*
             * CONSUMED
             */

            setText(
                consumedQuantity,
                formatNumber(
                    record.consumedQuantity
                )
            );


            /*
             * SHOW STEP 03.
             */

            materialResultPanel.classList.remove(
                "hidden"
            );


            /*
             * Scroll to result.
             *
             * This makes the fetched Excel
             * data immediately visible.
             */

            setTimeout(
                function () {

                    materialResultPanel.scrollIntoView(
                        {
                            behavior: "smooth",
                            block: "start"
                        }
                    );

                },
                50
            );


            /*
             * Console table for testing.
             */

            console.table(
                {
                    PO:
                        record.poNumber,

                    SO:
                        record.soNumber,

                    MaterialIdentifier:
                        record.materialIdentifier,

                    MaterialName:
                        record.materialName,

                    GRN:
                        record.receiptId,

                    UOM:
                        record.unitOfMeasure,

                    Received:
                        record.receivedQuantity,

                    Available:
                        record.availableQuantity,

                    Consumed:
                        record.consumedQuantity,

                    Status:
                        record.status,

                    LastUpdated:
                        record.lastUpdated
                }
            );

        }


        /* =====================================================
           CLEAR
           ===================================================== */

        function clearConsumption() {

            qrInput.value =
                "";


            scannedQr =
                null;


            consumptionRecord =
                null;


            qrResultPanel.classList.add(
                "hidden"
            );


            materialResultPanel.classList.add(
                "hidden"
            );


            confirmButton.disabled =
                true;


            if (qrMessage) {

                qrMessage.textContent =
                    "";

                qrMessage.classList.add(
                    "hidden"
                );

                qrMessage.classList.remove(
                    "error"
                );

                qrMessage.classList.remove(
                    "success"
                );
            }


            setText(
                qrPo,
                "-"
            );

            setText(
                qrSo,
                "-"
            );

            setText(
                qrId,
                "-"
            );

            setText(
                qrMaterialName,
                "-"
            );

            setText(
                qrGrn,
                "-"
            );


            setText(
                materialPo,
                "-"
            );

            setText(
                materialSo,
                "-"
            );

            setText(
                materialId,
                "-"
            );

            setText(
                materialName,
                "-"
            );

            setText(
                materialGrn,
                "-"
            );

            setText(
                materialUom,
                "-"
            );

            setText(
                materialStatus,
                "-"
            );

            setText(
                materialLastUpdated,
                "-"
            );


            setText(
                receivedQuantity,
                "0"
            );

            setText(
                availableQuantity,
                "0"
            );

            setText(
                consumedQuantity,
                "0"
            );


            qrInput.focus();

        }


        /* =====================================================
           EVENTS
           ===================================================== */

        readButton.addEventListener(
            "click",
            readQr
        );


        confirmButton.addEventListener(
            "click",
            confirmConsumption
        );


        if (clearButton) {

            clearButton.addEventListener(
                "click",
                clearConsumption
            );

        }


        /*
         * Scanner usually sends ENTER
         * after the QR value.
         *
         * ENTER = READ QR
         *
         * It does NOT fetch Excel.
         */

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


        /*
         * Keep focus on scanner input.
         */

        qrInput.focus();

    }
);