/* =========================================================
   BDL MES - IGQC / MATERIAL INFORMATION
   consumption.js

   FLOW:
   1. Read R1 QR
   2. Split QR data
   3. Immediately display QR information
   4. Confirm
   5. Fetch related Consumption record
   6. Display quantity information
   7. Enable Testing Assignment
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("IGQC consumption.js loaded.");

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const qrInput = document.getElementById("consumptionQrInput");
    const qrReadButton = document.getElementById("consumptionQrRead");
    const qrClearButton = document.getElementById("consumptionQrClear");
    const qrMessage = document.getElementById("qrMessage");

    const confirmButton = document.getElementById("confirmConsumption");

    /* Section 02 */
    const infoPo = document.getElementById("infoPo");
    const infoSo = document.getElementById("infoSo");
    const infoMaterialId = document.getElementById("infoMaterialId");
    const infoGrn = document.getElementById("infoGrn");
    const infoMaterialName = document.getElementById("infoMaterialName");
    const infoUom = document.getElementById("infoUom");
    const infoStatus = document.getElementById("infoStatus");
    const infoReceived = document.getElementById("infoReceived");
    const infoAvailable = document.getElementById("infoAvailable");
    const infoConsumed = document.getElementById("infoConsumed");

    /* Testing */
    const testingAssignmentPanel =
        document.getElementById("testingAssignmentPanel");

    const testingLab =
        document.getElementById("testingLab");

    const testingGrade =
        document.getElementById("testingGrade");

    const testingQuantity =
        document.getElementById("testingQuantity");

    const testingUom =
        document.getElementById("testingUom");

    const testingQuantityHelp =
        document.getElementById("testingQuantityHelp");

    const gradeDetails =
        document.getElementById("gradeDetails");

    const gradeDetailsSubtitle =
        document.getElementById("gradeDetailsSubtitle");

    const gradeEquipment =
        document.getElementById("gradeEquipment");

    const gradeSampleConsumed =
        document.getElementById("gradeSampleConsumed");

    const gradeExpectedResult =
        document.getElementById("gradeExpectedResult");

    const testingMessage =
        document.getElementById("testingMessage");

    const assignTestingButton =
        document.getElementById("assignTestingButton");

    const resetTestingButton =
        document.getElementById("resetTestingButton");

    /* Result */
    const testingResultPanel =
        document.getElementById("testingResultPanel");

    const resultPo =
        document.getElementById("resultPo");

    const resultSo =
        document.getElementById("resultSo");

    const resultGrn =
        document.getElementById("resultGrn");

    const resultMaterialId =
        document.getElementById("resultMaterialId");

    const resultMaterialName =
        document.getElementById("resultMaterialName");

    const resultTesting =
        document.getElementById("resultTesting");

    const resultGrade =
        document.getElementById("resultGrade");

    const resultQuantity =
        document.getElementById("resultQuantity");


    /* =====================================================
       CURRENT DATA
       ===================================================== */

    let currentQrData = null;
    let currentConsumptionRecord = null;

    let gradeData = {
        "Chemical Testing": [
            {
                id: "CH-G01",
                name: "Chemical Grade 1",
                equipment: ["LECO"],
                sampleConsumed: "Yes",
                expectedResult: "As per material specification"
            },
            {
                id: "CH-G02",
                name: "Chemical Grade 2",
                equipment: ["AAS"],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            },
            {
                id: "CH-G03",
                name: "Chemical Grade 3",
                equipment: ["XRF Spectrometer"],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            },
            {
                id: "CH-G04",
                name: "Chemical Grade 4",
                equipment: ["Optical Emission Spectrometer"],
                sampleConsumed: "Yes",
                expectedResult: "As per material specification"
            },
            {
                id: "CH-G05",
                name: "Chemical Grade 5",
                equipment: [
                    "LECO",
                    "Optical Emission Spectrometer"
                ],
                sampleConsumed: "Yes",
                expectedResult: "As per material specification"
            },
            {
                id: "CH-G06",
                name: "Chemical Grade 6",
                equipment: [
                    "LECO",
                    "AAS"
                ],
                sampleConsumed: "Yes",
                expectedResult: "As per material specification"
            },
            {
                id: "CH-G07",
                name: "Chemical Grade 7",
                equipment: [
                    "AAS",
                    "XRF Spectrometer"
                ],
                sampleConsumed: "Yes",
                expectedResult: "As per material specification"
            }
        ],

        "Mechanical Testing": [
            {
                id: "ME-G01",
                name: "Mechanical Grade 1",
                equipment: ["600 kl UTM"],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            },
            {
                id: "ME-G02",
                name: "Mechanical Grade 2",
                equipment: ["50 kl UTM"],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            },
            {
                id: "ME-G03",
                name: "Mechanical Grade 3",
                equipment: [
                    "Brinell Hardness machine(BHL)"
                ],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            },
            {
                id: "ME-G04",
                name: "Mechanical Grade 4",
                equipment: [
                    "Vicker Harness machine(HV)"
                ],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            },
            {
                id: "ME-G05",
                name: "Mechanical Grade 5",
                equipment: [
                    "Universal Testing Machine"
                ],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            },
            {
                id: "ME-G06",
                name: "Mechanical Grade 6",
                equipment: [
                    "Rockellwell"
                ],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            }
        ],

        "Dimensional Testing": [
            {
                id: "DI-G01",
                name: "Dimensional Grade 1",
                equipment: ["Dimensional Inspection Equipment"],
                sampleConsumed: "No",
                expectedResult: "As per material specification"
            }
        ]
    };


    /* =====================================================
       STARTUP CHECK
       ===================================================== */

    console.log("QR input:", qrInput);
    console.log("QR read button:", qrReadButton);
    console.log("Confirm button:", confirmButton);

    console.log("Section 02 elements:", {
        infoPo,
        infoSo,
        infoMaterialId,
        infoGrn,
        infoMaterialName,
        infoUom,
        infoStatus,
        infoReceived,
        infoAvailable,
        infoConsumed
    });


    /* =====================================================
       BASIC VALIDATION
       ===================================================== */

    if (!qrInput) {
        console.error("consumptionQrInput not found.");
        return;
    }

    if (!qrReadButton) {
        console.error("consumptionQrRead not found.");
        return;
    }

    if (!confirmButton) {
        console.error("confirmConsumption not found.");
        return;
    }


    /* =====================================================
       MESSAGE
       ===================================================== */

    function showMessage(message, type) {

        if (!qrMessage) {
            console.log(message);
            return;
        }

        qrMessage.textContent = message;

        qrMessage.classList.remove(
            "hidden",
            "success",
            "error"
        );

        if (type === "success") {
            qrMessage.classList.add("success");
        }

        if (type === "error") {
            qrMessage.classList.add("error");
        }
    }


    function hideMessage() {

        if (!qrMessage) {
            return;
        }

        qrMessage.textContent = "";

        qrMessage.classList.add("hidden");

        qrMessage.classList.remove(
            "success",
            "error"
        );
    }


    /* =====================================================
       RESET SECTION 02
       ===================================================== */

    function resetMaterialInformation() {

        if (infoPo) infoPo.textContent = "-";
        if (infoSo) infoSo.textContent = "-";
        if (infoMaterialId) infoMaterialId.textContent = "-";
        if (infoGrn) infoGrn.textContent = "-";
        if (infoMaterialName) infoMaterialName.textContent = "-";

        if (infoUom) infoUom.textContent = "-";
        if (infoStatus) infoStatus.textContent = "-";
        if (infoReceived) infoReceived.textContent = "-";
        if (infoAvailable) infoAvailable.textContent = "-";
        if (infoConsumed) infoConsumed.textContent = "-";
    }


    /* =====================================================
       PARSE R1 QR

       Expected:

       R1|PO|SO|ID|Material Name|GRN

       Example:

       R1|PO202608210000000001|
       SO202608210000000001|
       ID202608210001|
       Titanium|
       GRN-000001
       ===================================================== */

    function parseQrData(value) {

        if (!value) {
            throw new Error("QR data is empty.");
        }

        const cleanValue = value.trim();

        const parts = cleanValue
            .split("|")
            .map(function (item) {
                return item.trim();
            });

        console.log("QR parts:", parts);

        if (parts.length < 6) {
            throw new Error(
                "Invalid QR format. Expected R1|PO|SO|ID|Material Name|GRN."
            );
        }

        const version = parts[0];

        if (
            version.toUpperCase() !== "R1" &&
            version.toUpperCase() !== "V1"
        ) {
            throw new Error(
                "Invalid QR version: " + version
            );
        }

        const po = parts[1];
        const so = parts[2];
        const id = parts[3];
        const materialName = parts[4];

        /*
         * Material name normally does not contain |.
         * GRN is the last value so this also handles
         * accidental extra separators safely.
         */
        const grn = parts[parts.length - 1];

        if (!po || !so || !id || !materialName || !grn) {
            throw new Error(
                "QR contains incomplete material information."
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
       DISPLAY QR DATA IMMEDIATELY

       IMPORTANT:
       This happens after READ QR.

       We do NOT wait for CONFIRM.
       ===================================================== */

    function displayQrInformation(data) {

        console.log("Displaying QR information:", data);

        if (infoPo) {
            infoPo.textContent = data.po;
        }

        if (infoSo) {
            infoSo.textContent = data.so;
        }

        if (infoMaterialId) {
            infoMaterialId.textContent = data.id;
        }

        if (infoGrn) {
            infoGrn.textContent = data.grn;
        }

        if (infoMaterialName) {
            infoMaterialName.textContent = data.mn;
        }

        /*
         * Quantity information has NOT been fetched yet.
         * Keep it blank until CONFIRM.
         */

        if (infoUom) {
            infoUom.textContent = "-";
        }

        if (infoStatus) {
            infoStatus.textContent = "-";
        }

        if (infoReceived) {
            infoReceived.textContent = "-";
        }

        if (infoAvailable) {
            infoAvailable.textContent = "-";
        }

        if (infoConsumed) {
            infoConsumed.textContent = "-";
        }
    }


    /* =====================================================
       READ QR
       ===================================================== */

    async function readQr() {

        console.log("READ QR clicked.");

        hideMessage();

        const rawValue = qrInput.value.trim();

        console.log("Raw QR:", rawValue);

        if (!rawValue) {

            showMessage(
                "Please scan or enter the material QR.",
                "error"
            );

            return;
        }

        try {

            const parsed = parseQrData(rawValue);

            console.log(
                "QR successfully parsed:",
                parsed
            );

            currentQrData = parsed;

            currentConsumptionRecord = null;

            /*
             * THIS IS THE IMPORTANT PART:
             * Populate Section 02 immediately.
             */
            displayQrInformation(parsed);

            showMessage(
                "QR code successfully identified.",
                "success"
            );

            /*
             * Confirm becomes available.
             */
            confirmButton.disabled = false;

            /*
             * Hide previous testing assignment.
             */
            if (testingAssignmentPanel) {
                testingAssignmentPanel.classList.add("hidden");
            }

            if (testingResultPanel) {
                testingResultPanel.classList.add("hidden");
            }

        } catch (error) {

            console.error(
                "QR parsing error:",
                error
            );

            currentQrData = null;

            resetMaterialInformation();

            confirmButton.disabled = true;

            showMessage(
                error.message || "Invalid QR code.",
                "error"
            );
        }
    }


    /* =====================================================
       FETCH CONSUMPTION RECORD

       This happens ONLY after CONFIRM.
       ===================================================== */

    async function confirmMaterial() {

        console.log("=================================");
        console.log("CONFIRM MATERIAL CLICKED");
        console.log("=================================");

        if (!currentQrData) {

            showMessage(
                "Please read the QR code first.",
                "error"
            );

            return;
        }

        /*
         * currentQrData contains:
         *
         * {
         *   version: "R1",
         *   po: "...",
         *   so: "...",
         *   id: "...",
         *   mn: "...",
         *   grn: "..."
         * }
         */

        console.log(
            "QR data already parsed:",
            currentQrData
        );

        /*
         * Send the four identifiers expected by
         * the Consumption CONFIRM API.
         */

        const payload = {
            po: String(currentQrData.po || "").trim(),
            so: String(currentQrData.so || "").trim(),
            id: String(currentQrData.id || "").trim(),
            grn: String(currentQrData.grn || "").trim()
        };

        /*
         * Validate before calling API.
         */

        if (!payload.po ||
            !payload.so ||
            !payload.id ||
            !payload.grn) {

            showMessage(
                "QR data is incomplete. PO, SO, Material ID and GRN are required.",
                "error"
            );

            return;
        }

        console.log(
            "Consumption lookup payload:",
            payload
        );

        confirmButton.disabled = true;

        const originalText =
            confirmButton.innerHTML;

        confirmButton.innerHTML =
            "LOADING...";

        try {

            showMessage(
                "Fetching related consumption record..."
            );

            /*
             * IMPORTANT:
             *
             * Use /confirm here.
             *
             * /scan expects QR-data style input.
             * /confirm is the endpoint for finding
             * the Consumption.xlsx record using:
             *
             * PO + SO + ID + GRN
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
                            JSON.stringify(payload)
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

            } catch (jsonError) {

                throw new Error(
                    "Consumption API returned invalid JSON."
                );
            }

            console.log(
                "Consumption API response:",
                data
            );

            /*
             * HTTP error
             */

            if (!response.ok) {

                throw new Error(
                    data?.message ||
                    data?.error ||
                    "Failed to fetch consumption record."
                );
            }

            /*
             * Backend reported failure
             */

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
             * Find the returned record.
             *
             * Expected backend response:
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
             * Some APIs may return the record directly.
             */

            if (!record && data) {

                if (
                    data.poNumber ||
                    data.PoNumber ||
                    data.po
                ) {

                    record = data;
                }
            }

            /*
             * Array protection.
             */

            if (Array.isArray(record)) {

                record =
                    record.length > 0
                        ? record[0]
                        : null;
            }

            /*
             * Nothing returned.
             */

            if (!record) {

                throw new Error(
                    data?.message ||
                    "No related consumption record found."
                );
            }

            /*
             * Make sure this really is a
             * Consumption.xlsx record.
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
             * Store complete Excel record.
             */

            currentConsumptionRecord =
                record;

            console.log(
                "================================="
            );

            console.log(
                "CONSUMPTION RECORD FOUND"
            );

            console.log(
                currentConsumptionRecord
            );

            console.log(
                "================================="
            );

            /*
             * DISPLAY COMPLETE CONSUMPTION DATA
             */

            displayConsumptionRecord(
                currentConsumptionRecord
            );

            /*
             * Make sure Material Information
             * section is visible.
             */

            

            /*
             * Enable testing assignment.
             */

            showTestingAssignment();

            /*
             * Load grades after the material
             * record is successfully found.
             */

            await loadGrades();

            /*
             * Update message.
             */

            showMessage(
                "Consumption record successfully loaded.",
                "success"
            );

            /*
             * Move screen to material information.
             */

           

        }
        catch (error) {

            console.error(
                "================================="
            );

            console.error(
                "CONSUMPTION FETCH ERROR"
            );

            console.error(
                error
            );

            console.error(
                "================================="
            );

            currentConsumptionRecord =
                null;

            /*
             * Do not hide the QR information.
             *
             * The user should still be able
             * to see what was scanned.
             */

            showMessage(
                error.message ||
                "Unable to fetch consumption record.",
                "error"
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
       DISPLAY CONSUMPTION RECORD
       ===================================================== */

    function displayConsumptionRecord(record) {

        console.log(
            "Displaying consumption record:",
            record
        );

        /*
         * Support C# JSON camelCase and PascalCase.
         */

        const po =
            record.poNumber ??
            record.PoNumber ??
            record.po ??
            "-";

        const so =
            record.soNumber ??
            record.SoNumber ??
            record.so ??
            "-";

        const materialId =
            record.materialIdentifier ??
            record.MaterialIdentifier ??
            record.id ??
            "-";

        const grn =
            record.receiptId ??
            record.ReceiptId ??
            record.grn ??
            "-";

        const materialName =
            record.materialName ??
            record.MaterialName ??
            record.mn ??
            "-";

        const uom =
            record.unitOfMeasure ??
            record.UnitOfMeasure ??
            record.uom ??
            "-";

        const status =
            record.status ??
            record.Status ??
            "-";

        const received =
            record.receivedQuantity ??
            record.ReceivedQuantity ??
            0;

        const available =
            record.availableQuantity ??
            record.AvailableQuantity ??
            0;

        const consumed =
            record.consumedQuantity ??
            record.ConsumedQuantity ??
            0;


        /*
         * Keep Section 02 QR information synchronized
         * with the actual Excel record.
         */

        if (infoPo) {
            infoPo.textContent = po;
        }

        if (infoSo) {
            infoSo.textContent = so;
        }

        if (infoMaterialId) {
            infoMaterialId.textContent = materialId;
        }

        if (infoGrn) {
            infoGrn.textContent = grn;
        }

        if (infoMaterialName) {
            infoMaterialName.textContent = materialName;
        }

        if (infoUom) {
            infoUom.textContent = uom;
        }

        if (infoStatus) {
            infoStatus.textContent = status;
        }

        if (infoReceived) {
            infoReceived.textContent = formatNumber(received);
        }

        if (infoAvailable) {
            infoAvailable.textContent = formatNumber(available);
        }

        if (infoConsumed) {
            infoConsumed.textContent = formatNumber(consumed);
        }


        /*
         * Testing quantity uses the available quantity.
         */

        if (testingUom) {
            testingUom.textContent = uom;
        }

        if (testingQuantityHelp) {

            testingQuantityHelp.textContent =
                "Available quantity: " +
                formatNumber(available) +
                " " +
                uom;
        }

        if (testingQuantity) {

            testingQuantity.max = available;

            testingQuantity.value = "";

            testingQuantity.disabled =
                available <= 0;
        }

        console.log(
            "Section 02 populated successfully."
        );
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
       SHOW TESTING ASSIGNMENT
       ===================================================== */

    function showTestingAssignment() {

        if (!testingAssignmentPanel) {
            console.warn(
                "testingAssignmentPanel not found."
            );
            return;
        }

        testingAssignmentPanel.classList.remove(
            "hidden"
        );

        console.log(
            "Testing Assignment displayed."
        );
    }


    /* =====================================================
       LOAD TESTING GRADES
       ===================================================== */

    function loadTestingGrades() {

        if (!testingLab || !testingGrade) {
            return;
        }

        const lab =
            testingLab.value;

        testingGrade.innerHTML = "";

        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";
        defaultOption.textContent =
            "Select testing grade";

        testingGrade.appendChild(
            defaultOption
        );

        testingGrade.disabled = true;

        clearGradeDetails();

        if (!lab) {

            defaultOption.textContent =
                "Select testing lab first";

            return;
        }

        const grades =
            gradeData[lab] || [];

        console.log(
            "Grades for",
            lab,
            grades
        );

        if (grades.length === 0) {

            defaultOption.textContent =
                "No grades available";

            return;
        }

        grades.forEach(function (grade) {

            const option =
                document.createElement("option");

            option.value = grade.id;

            option.textContent =
                grade.id +
                " - " +
                grade.name;

            testingGrade.appendChild(
                option
            );
        });

        testingGrade.disabled = false;
    }


    /* =====================================================
       DISPLAY GRADE DETAILS
       ===================================================== */

    function displayGradeDetails() {

        if (!testingLab || !testingGrade) {
            return;
        }

        const lab =
            testingLab.value;

        const gradeId =
            testingGrade.value;

        const grades =
            gradeData[lab] || [];

        const grade =
            grades.find(function (item) {
                return item.id === gradeId;
            });

        if (!grade) {

            clearGradeDetails();

            validateTestingForm();

            return;
        }

        console.log(
            "Selected grade:",
            grade
        );

        if (gradeDetails) {
            gradeDetails.classList.remove(
                "hidden"
            );
        }

        if (gradeDetailsSubtitle) {
            gradeDetailsSubtitle.textContent =
                grade.id +
                " - " +
                grade.name;
        }

        if (gradeEquipment) {

            gradeEquipment.innerHTML = "";

            grade.equipment.forEach(
                function (equipment) {

                    const item =
                        document.createElement("div");

                    item.textContent =
                        equipment;

                    gradeEquipment.appendChild(
                        item
                    );
                }
            );
        }

        if (gradeSampleConsumed) {
            gradeSampleConsumed.textContent =
                grade.sampleConsumed;
        }

        if (gradeExpectedResult) {
            gradeExpectedResult.textContent =
                grade.expectedResult;
        }

        validateTestingForm();
    }


    /* =====================================================
       CLEAR GRADE DETAILS
       ===================================================== */

    function clearGradeDetails() {

        if (gradeDetails) {
            gradeDetails.classList.add(
                "hidden"
            );
        }

        if (gradeDetailsSubtitle) {
            gradeDetailsSubtitle.textContent =
                "-";
        }

        if (gradeEquipment) {
            gradeEquipment.textContent =
                "-";
        }

        if (gradeSampleConsumed) {
            gradeSampleConsumed.textContent =
                "-";
        }

        if (gradeExpectedResult) {
            gradeExpectedResult.textContent =
                "-";
        }
    }


    /* =====================================================
       VALIDATE TESTING FORM
       ===================================================== */

    function validateTestingForm() {

        if (!assignTestingButton) {
            return;
        }

        if (
            !currentConsumptionRecord ||
            !testingLab ||
            !testingGrade ||
            !testingQuantity
        ) {

            assignTestingButton.disabled =
                true;

            return;
        }

        const lab =
            testingLab.value;

        const grade =
            testingGrade.value;

        const quantity =
            Number(testingQuantity.value);

        const available =
            Number(
                currentConsumptionRecord.availableQuantity ??
                currentConsumptionRecord.AvailableQuantity ??
                0
            );

        const valid =
            lab &&
            grade &&
            Number.isFinite(quantity) &&
            quantity > 0 &&
            quantity <= available;

        assignTestingButton.disabled =
            !valid;
    }


    /* =====================================================
       ASSIGN TESTING
       ===================================================== */

    async function assignTesting() {

        if (!currentConsumptionRecord) {
            return;
        }

        const quantity =
            Number(testingQuantity.value);

        const available =
            Number(
                currentConsumptionRecord.availableQuantity ??
                currentConsumptionRecord.AvailableQuantity ??
                0
            );

        if (!testingLab.value) {

            showTestingMessage(
                "Please select testing lab.",
                "error"
            );

            return;
        }

        if (!testingGrade.value) {

            showTestingMessage(
                "Please select testing grade.",
                "error"
            );

            return;
        }

        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            showTestingMessage(
                "Please enter testing quantity.",
                "error"
            );

            return;
        }

        if (quantity > available) {

            showTestingMessage(
                "Testing quantity cannot exceed available quantity.",
                "error"
            );

            return;
        }

        const lab =
            testingLab.value;

        const gradeId =
            testingGrade.value;

        const grade =
            (gradeData[lab] || []).find(
                function (item) {
                    return item.id === gradeId;
                }
            );

        if (!grade) {
            return;
        }

        /*
         * For now this creates the assignment in the UI.
         *
         * Backend save API can be connected next.
         */

        if (resultPo) {
            resultPo.textContent =
                getRecordValue(
                    currentConsumptionRecord,
                    "poNumber",
                    "PoNumber"
                );
        }

        if (resultSo) {
            resultSo.textContent =
                getRecordValue(
                    currentConsumptionRecord,
                    "soNumber",
                    "SoNumber"
                );
        }

        if (resultGrn) {
            resultGrn.textContent =
                getRecordValue(
                    currentConsumptionRecord,
                    "receiptId",
                    "ReceiptId"
                );
        }

        if (resultMaterialId) {
            resultMaterialId.textContent =
                getRecordValue(
                    currentConsumptionRecord,
                    "materialIdentifier",
                    "MaterialIdentifier"
                );
        }

        if (resultMaterialName) {
            resultMaterialName.textContent =
                getRecordValue(
                    currentConsumptionRecord,
                    "materialName",
                    "MaterialName"
                );
        }

        if (resultTesting) {
            resultTesting.textContent =
                lab;
        }

        if (resultGrade) {
            resultGrade.textContent =
                grade.id +
                " - " +
                grade.name;
        }

        if (resultQuantity) {
            resultQuantity.textContent =
                quantity +
                " " +
                (
                    currentConsumptionRecord.unitOfMeasure ??
                    currentConsumptionRecord.UnitOfMeasure ??
                    "-"
                );
        }

        if (testingResultPanel) {
            testingResultPanel.classList.remove(
                "hidden"
            );
        }

        showTestingMessage(
            "Testing assignment created successfully.",
            "success"
        );

        console.log(
            "Testing assignment:",
            {
                po: getRecordValue(
                    currentConsumptionRecord,
                    "poNumber",
                    "PoNumber"
                ),
                so: getRecordValue(
                    currentConsumptionRecord,
                    "soNumber",
                    "SoNumber"
                ),
                grn: getRecordValue(
                    currentConsumptionRecord,
                    "receiptId",
                    "ReceiptId"
                ),
                materialIdentifier:
                    getRecordValue(
                        currentConsumptionRecord,
                        "materialIdentifier",
                        "MaterialIdentifier"
                    ),
                materialName:
                    getRecordValue(
                        currentConsumptionRecord,
                        "materialName",
                        "MaterialName"
                    ),
                testingLab: lab,
                grade: grade,
                quantity: quantity
            }
        );
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
       TESTING MESSAGE
       ===================================================== */

    function showTestingMessage(
        message,
        type
    ) {

        if (!testingMessage) {
            return;
        }

        testingMessage.textContent =
            message;

        testingMessage.classList.remove(
            "hidden",
            "success",
            "error"
        );

        testingMessage.classList.add(
            type === "error"
                ? "error"
                : "success"
        );
    }


    /* =====================================================
       RESET TESTING
       ===================================================== */

    function resetTesting() {

        currentConsumptionRecord = null;

        if (testingLab) {
            testingLab.value = "";
        }

        if (testingGrade) {

            testingGrade.innerHTML =
                "<option value=''>Select testing lab first</option>";

            testingGrade.disabled = true;
        }

        if (testingQuantity) {
            testingQuantity.value = "";
            testingQuantity.disabled = true;
        }

        if (testingUom) {
            testingUom.textContent = "-";
        }

        if (testingQuantityHelp) {
            testingQuantityHelp.textContent =
                "Available quantity: 0";
        }

        clearGradeDetails();

        if (testingMessage) {

            testingMessage.textContent = "";

            testingMessage.classList.add(
                "hidden"
            );
        }

        if (testingResultPanel) {
            testingResultPanel.classList.add(
                "hidden"
            );
        }

        if (assignTestingButton) {
            assignTestingButton.disabled =
                true;
        }
    }


    /* =====================================================
       CLEAR EVERYTHING
       ===================================================== */

    function clearAll() {

        console.log("CLEAR clicked.");

        qrInput.value = "";

        currentQrData = null;

        currentConsumptionRecord = null;

        resetMaterialInformation();

        confirmButton.disabled = true;

        hideMessage();

        resetTesting();

        qrInput.focus();
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    qrReadButton.addEventListener(
        "click",
        readQr
    );


    confirmButton.addEventListener(
        "click",
        confirmMaterial
    );


    if (qrClearButton) {

        qrClearButton.addEventListener(
            "click",
            clearAll
        );
    }


    /*
     * Scanner often sends ENTER after the QR payload.
     */
    qrInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                readQr();
            }
        }
    );


    if (testingLab) {

        testingLab.addEventListener(
            "change",
            function () {

                loadTestingGrades();
            }
        );
    }


    if (testingGrade) {

        testingGrade.addEventListener(
            "change",
            function () {

                displayGradeDetails();
            }
        );
    }


    if (testingQuantity) {

        testingQuantity.addEventListener(
            "input",
            function () {

                validateTestingForm();
            }
        );
    }


    if (assignTestingButton) {

        assignTestingButton.addEventListener(
            "click",
            assignTesting
        );
    }


    if (resetTestingButton) {

        resetTestingButton.addEventListener(
            "click",
            resetTesting
        );
    }


    /* =====================================================
       INITIAL STATE
       ===================================================== */

    resetMaterialInformation();

    confirmButton.disabled = true;

    resetTesting();

    console.log(
        "IGQC module initialized successfully."
    );
});