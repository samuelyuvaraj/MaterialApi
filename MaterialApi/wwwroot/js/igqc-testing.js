/* =========================================================
   IGQC TESTING
   Confirm Testing -> POST /api/igqc/testing/assign
   Existing QR / Consumption / Grade APIs are untouched.
   ========================================================= */

(function () {
    "use strict";

    let materialData = null;

    function getElement(id) {
        return document.getElementById(id);
    }

    function value(id) {
        const el = getElement(id);
        return el ? el.textContent.trim() : "";
    }

    function inputValue(id) {
        const el = getElement(id);
        return el ? el.value.trim() : "";
    }

    function numberOrNull(id) {
        const raw = inputValue(id);
        if (raw === "") return null;

        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
    }

    function showMessage(message, type) {
        const el = getElement("testingMessage");

        if (!el) return;

        el.textContent = message || "";
        el.classList.remove("hidden", "success", "error");

        if (type) {
            el.classList.add(type);
        }
    }

    function getStoredMaterial() {
        const keys = [
            "igqcTestingMaterial",
            "currentConsumptionRecord",
            "consumptionRecord",
            "igqcMaterial"
        ];

        for (const storage of [sessionStorage, localStorage]) {
            for (const key of keys) {
                try {
                    const raw = storage.getItem(key);

                    if (!raw) continue;

                    const parsed = JSON.parse(raw);

                    if (parsed) {
                        return parsed;
                    }
                } catch (error) {
                    console.warn(
                        "Unable to read stored material:",
                        key,
                        error
                    );
                }
            }
        }

        return null;
    }

    function normalizeMaterial(data) {
        if (!data) return null;

        if (data.record) data = data.record;
        else if (data.consumptionRecord)
            data = data.consumptionRecord;
        else if (data.consumption)
            data = data.consumption;

        return {
            po:
                data.po ??
                data.poNumber ??
                data.PoNumber ??
                "",

            so:
                data.so ??
                data.soNumber ??
                data.SoNumber ??
                "",

            materialId:
                data.materialIdentifier ??
                data.materialId ??
                data.MaterialIdentifier ??
                data.MaterialId ??
                "",

            grn:
                data.grn ??
                data.receiptId ??
                data.GRN ??
                data.grnNumber ??
                "",

            materialName:
                data.materialName ??
                data.mn ??
                data.MaterialName ??
                "",

            unit:
                data.unitOfMeasure ??
                data.unit ??
                data.uom ??
                "",

            status:
                data.status ??
                data.Status ??
                "",

            received:
                data.receivedQuantity ??
                data.received ??
                data.ReceivedQuantity ??
                "",

            available:
                data.availableQuantity ??
                data.available ??
                data.AvailableQuantity ??
                "",

            consumed:
                data.consumedQuantity ??
                data.consumed ??
                data.ConsumedQuantity ??
                ""
        };
    }

    function populateMaterial(data) {
        if (!data) return;

        const set = (id, v) => {
            const el = getElement(id);
            if (el) {
                el.textContent =
                    v === null ||
                        v === undefined ||
                        v === ""
                        ? "-"
                        : String(v);
            }
        };

        set("po", data.po);
        set("so", data.so);
        set("materialId", data.materialId);
        set("grn", data.grn);
        set("materialName", data.materialName);
        set("unit", data.unit);
        set("status", data.status);
        set("received", data.received);
        set("available", data.available);
        set("consumed", data.consumed);

        set("chemicalUom", data.unit || "u");
        set("mechanicalUom", data.unit || "u");
        set("dimensionalUom", data.unit || "u");
    }

    async function loadGrades(testingType, selectId) {
        const select = getElement(selectId);

        if (!select) return;

        select.innerHTML =
            '<option value="">Loading grades...</option>';

        try {
            const response = await fetch(
                "/api/igqc/grades/" +
                encodeURIComponent(testingType)
            );

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(
                    data.message ||
                    "Unable to load testing grades."
                );
            }

            const grades = data.grades || [];

            select.innerHTML =
                '<option value="">Select testing grade</option>';

            grades.forEach(function (grade) {
                const option =
                    document.createElement("option");

                option.value =
                    grade.gradeId || "";

                option.textContent =
                    grade.gradeName ||
                    grade.gradeId ||
                    "";

                option.dataset.equipment =
                    grade.equipment || "";

                option.dataset.sampleConsumed =
                    grade.sampleConsumed || "";

                select.appendChild(option);
            });

            if (!grades.length) {
                select.innerHTML =
                    '<option value="">No grades available</option>';
            }

        } catch (error) {
            console.error(
                "Grade loading error:",
                testingType,
                error
            );

            select.innerHTML =
                '<option value="">Grade data unavailable</option>';
        }
    }

    function setupGradeDetails(selectId, detailsId) {
        const select = getElement(selectId);
        const details = getElement(detailsId);

        if (!select || !details) return;

        select.addEventListener("change", function () {
            const option =
                select.options[select.selectedIndex];

            if (!option || !option.value) {
                details.innerHTML = "";
                details.classList.add("hidden");
                return;
            }

            const equipment =
                option.dataset.equipment || "";

            const sampleConsumed =
                option.dataset.sampleConsumed || "";

            details.innerHTML =
                (equipment
                    ? "Equipment: " + equipment
                    : "") +
                (equipment && sampleConsumed
                    ? " | "
                    : "") +
                (sampleConsumed
                    ? "Sample Consumed: " +
                    sampleConsumed
                    : "");

            details.classList.remove("hidden");
        });
    }

    function getSelection(
        gradeId,
        quantityId
    ) {
        const grade =
            inputValue(gradeId);

        return {
            selected: !!grade,
            gradeId: grade,
            quantity:
                numberOrNull(quantityId)
        };
    }

    function validateSelection(
        selection,
        name
    ) {
        if (!selection.selected) {
            return null;
        }

        if (
            selection.quantity === null ||
            selection.quantity <= 0
        ) {
            return (
                "Enter a quantity greater than zero for " +
                name +
                "."
            );
        }

        const available =
            Number(materialData?.available);

        if (
            Number.isFinite(available) &&
            selection.quantity > available
        ) {
            return (
                name +
                " quantity cannot exceed available quantity (" +
                available +
                " " +
                (materialData.unit || "") +
                ")."
            );
        }

        return null;
    }

    function buildRequest() {
        return {
            po: materialData?.po || value("po"),
            so: materialData?.so || value("so"),
            materialId:
                materialData?.materialId ||
                value("materialId"),
            grn:
                materialData?.grn ||
                value("grn"),
            materialName:
                materialData?.materialName ||
                value("materialName"),
            unit:
                materialData?.unit ||
                value("unit"),
            status:
                materialData?.status ||
                value("status"),

            received:
                Number.isFinite(
                    Number(materialData?.received)
                )
                    ? Number(materialData.received)
                    : null,

            available:
                Number.isFinite(
                    Number(materialData?.available)
                )
                    ? Number(materialData.available)
                    : null,

            consumed:
                Number.isFinite(
                    Number(materialData?.consumed)
                )
                    ? Number(materialData.consumed)
                    : null,

            chemical:
                getSelection(
                    "chemicalGrade",
                    "chemicalQuantity"
                ),

            mechanical:
                getSelection(
                    "mechanicalGrade",
                    "mechanicalQuantity"
                ),

            dimensional:
                getSelection(
                    "dimensionalGrade",
                    "dimensionalQuantity"
                )
        };
    }

    async function confirmTesting() {
        const button =
            getElement("confirmTesting");

        if (!materialData) {
            showMessage(
                "Material information is not available.",
                "error"
            );
            return;
        }

        const request =
            buildRequest();

        if (
            !request.chemical.selected &&
            !request.mechanical.selected &&
            !request.dimensional.selected
        ) {
            showMessage(
                "Select at least one testing type.",
                "error"
            );
            return;
        }

        const errors = [
            validateSelection(
                request.chemical,
                "Chemical Testing"
            ),
            validateSelection(
                request.mechanical,
                "Mechanical Testing"
            ),
            validateSelection(
                request.dimensional,
                "Dimensional Testing"
            )
        ].filter(Boolean);

        if (errors.length) {
            showMessage(errors[0], "error");
            return;
        }

        if (!button) return;

        const oldText = button.innerHTML;

        button.disabled = true;
        button.innerHTML = "SAVING...";

        try {
            console.log(
                "Submitting IGQC testing assignment:",
                request
            );

            const response = await fetch(
                "/api/igqc/testing/assign",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body:
                        JSON.stringify(request)
                }
            );

            const raw =
                await response.text();

            let data = {};

            try {
                data =
                    raw
                        ? JSON.parse(raw)
                        : {};
            } catch {
                throw new Error(
                    "Testing API returned invalid JSON."
                );
            }

            if (
                !response.ok ||
                data.success === false
            ) {
                throw new Error(
                    data.message ||
                    data.detail ||
                    "Unable to save testing assignment."
                );
            }

            console.log(
                "Testing assignment saved:",
                data
            );

            showMessage(
                "Testing assignment saved successfully.",
                "success"
            );

            /*
             * Redirect only after the API confirms
             * that the Excel row was saved.
             */
            setTimeout(function () {
                window.location.href =
                    "/consumption.html";
            }, 700);

        } catch (error) {
            console.error(
                "Testing assignment save error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to save testing assignment.",
                "error"
            );

            button.disabled = false;
            button.innerHTML = oldText;
        }
    }

    function initialize() {
        materialData =
            normalizeMaterial(
                getStoredMaterial()
            );

        if (materialData) {
            populateMaterial(materialData);
        } else {
            console.warn(
                "No material data found."
            );
        }

        loadGrades(
            "Chemical Testing",
            "chemicalGrade"
        );

        loadGrades(
            "Mechanical Testing",
            "mechanicalGrade"
        );

        loadGrades(
            "Dimensional Testing",
            "dimensionalGrade"
        );

        setupGradeDetails(
            "chemicalGrade",
            "chemicalDetails"
        );

        setupGradeDetails(
            "mechanicalGrade",
            "mechanicalDetails"
        );

        setupGradeDetails(
            "dimensionalGrade",
            "dimensionalDetails"
        );

        getElement("confirmTesting")
            ?.addEventListener(
                "click",
                confirmTesting
            );

        getElement("cancelTesting")
            ?.addEventListener(
                "click",
                function () {
                    window.location.href =
                        "/consumption.html";
                }
            );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }
})();
