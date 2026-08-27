/* =========================================================
   TITAN MES - RECEIVE GOODS
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */
console.log("RECEIVE GOODS JS LOADED");
const poNumber =
    document.getElementById("inboundPoNumber");

const vendorCode =
    document.getElementById("inboundVendorCode");

const vendorName =
    document.getElementById("inboundVendorName");

const materialIdentifier =
    document.getElementById("inboundMaterialIdentifier");

const materialLookup =
    document.getElementById("inboundMaterialLookup");

const materialClear =
    document.getElementById("inboundMaterialClear");

const materialResult =
    document.getElementById("inboundMaterialResult");

const materialResultIcon =
    document.getElementById("inboundResultIcon");

const materialName =
    document.getElementById("inboundMaterialName");

const materialMessage =
    document.getElementById("inboundMaterialMessage");

const resultIdentifier =
    document.getElementById("inboundResultIdentifier");

const resultUom =
    document.getElementById("inboundResultUom");

const resultClass =
    document.getElementById("inboundResultClass");

const quantity =
    document.getElementById("inboundQuantity");

const uom =
    document.getElementById("inboundUom");

const batch =
    document.getElementById("inboundBatch");

const invoice =
    document.getElementById("inboundInvoice");

const remarks =
    document.getElementById("inboundRemarks");

const clearButton =
    document.getElementById("inboundClearButton");

const saveButton =
    document.getElementById("inboundSaveButton");
console.log("SAVE BUTTON:", saveButton);

const successPanel =
    document.getElementById("inboundSuccessPanel");

const receiptId =
    document.getElementById("createdReceiptId");

const viewReceiptButton =
    document.getElementById("viewCreatedReceipt");
const resultMaterialName =
    document.getElementById(
        "inboundResultMaterialName"
    );


/* =========================================================
   STATE
   ========================================================= */

let selectedMaterial = null;


/* =========================================================
   MATERIAL LOOKUP
   ========================================================= */

async function lookupMaterial() {

    const value =
        materialIdentifier.value.trim();


    if (!value) {

        materialIdentifier.focus();

        return;

    }


    materialLookup.disabled =
        true;

    materialLookup.innerHTML =
        "LOOKING...";


    try {

        const response =
            await fetch(
                `/api/material/${encodeURIComponent(value)}`
            );


        let data = null;


        try {

            data =
                await response.json();

        }
        catch {

            data = null;

        }


        if (
            response.ok &&
            data &&
            data.success
        ) {

            selectedMaterial =
                data.material;


            showMaterial(
                selectedMaterial
            );

        }
        else {

            selectedMaterial =
                null;


            showMaterialError(
                data?.message ||
                "Material not found."
            );

        }

    }
    catch (error) {

        console.error(
            "Material lookup error:",
            error
        );


        selectedMaterial =
            null;


        showMaterialError(
            "Unable to connect to Material API."
        );

    }
    finally {

        materialLookup.disabled =
            false;

        materialLookup.innerHTML =
            '<span class="validate-icon">✓</span> LOOKUP';

        materialIdentifier.focus();

    }

}


/* =========================================================
   SHOW MATERIAL
   ========================================================= */

function showMaterial(material) {

    materialResult.classList.remove(
        "hidden",
        "error"
    );


    materialResultIcon.textContent =
        "✓";


    materialName.textContent =
        material.name || "-";


    materialMessage.textContent =
        "Material successfully identified.";


    resultIdentifier.textContent =
        material.identifier || "-";


    resultUom.textContent =
        material.unitOfMeasure || "-";


    resultClass.textContent =
        material.materialClass || "-";


    /*
     * Automatically populate UOM.
     */

    uom.value =
        material.unitOfMeasure || "";

    resultMaterialName.textContent =
        material.name || "-";

    /*
     * Focus quantity after successful scan.
     */

    quantity.focus();

}


/* =========================================================
   SHOW MATERIAL ERROR
   ========================================================= */

function showMaterialError(message) {

    materialResult.classList.remove(
        "hidden"
    );


    materialResult.classList.add(
        "error"
    );


    materialResultIcon.textContent =
        "×";


    materialName.textContent =
        "Material Not Found";


    materialMessage.textContent =
        message;


    resultIdentifier.textContent =
        "-";


    resultUom.textContent =
        "-";


    resultClass.textContent =
        "-";


    uom.value =
        "";

}


/* =========================================================
   CLEAR MATERIAL
   ========================================================= */

function clearMaterial() {

    materialIdentifier.value =
        "";


    selectedMaterial =
        null;


    materialResult.classList.add(
        "hidden"
    );


    materialResult.classList.remove(
        "error"
    );


    uom.value =
        "";


    materialIdentifier.focus();

}


/* =========================================================
   SAVE INBOUND GOODS
   ========================================================= */

async function saveInbound() {

    const po =
        poNumber.value.trim();

    const vendor =
        vendorName.value.trim();

    const material =
        materialIdentifier.value.trim();

    const qty =
        Number(
            quantity.value
        );


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (!po) {

        alert(
            "Please enter the Purchase Order number."
        );

        poNumber.focus();

        return;

    }


    if (!vendor) {

        alert(
            "Please enter the Vendor Name."
        );

        vendorName.focus();

        return;

    }


    if (!material) {

        alert(
            "Please enter or scan the Material Identifier."
        );

        materialIdentifier.focus();

        return;

    }


    /*
     * Material must be validated before saving.
     */

    if (
        !selectedMaterial ||
        selectedMaterial.identifier !==
        material
    ) {

        alert(
            "Please lookup and validate the material first."
        );

        materialIdentifier.focus();

        return;

    }


    if (
        !qty ||
        qty <= 0
    ) {

        alert(
            "Please enter a valid quantity."
        );

        quantity.focus();

        return;

    }


    /* -----------------------------------------------------
       REQUEST
       ----------------------------------------------------- */

    const requestBody = {

        poNumber:
            po,

        vendorCode:
            vendorCode.value.trim(),

        vendorName:
            vendor,

        materialIdentifier:
            material,
        materialName:
            selectedMaterial?.name || "",

        unitOfMeasure:
            uom.value.trim(),

        quantity:
            qty,

        batchLotNumber:
            batch.value.trim(),

        supplierInvoice:
            invoice.value.trim(),

        remarks:
            remarks.value.trim()

    };


    /* -----------------------------------------------------
       BUTTON STATE
       ----------------------------------------------------- */

    saveButton.disabled =
        true;

    saveButton.innerHTML =
        "SAVING...";


    try {

        const response =
            await fetch(
                "/api/inbound",
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        )
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        }
        catch {

            data = null;

        }


        if (
            response.ok &&
            data &&
            data.success
        ) {

            showSaveSuccess(
                data
            );

        }
        else {

            alert(
                data?.message ||
                "Unable to save inbound goods."
            );

        }

    }
    catch (error) {

        console.error(
            "Inbound save error:",
            error
        );


        alert(
            "Unable to connect to Inbound API."
        );

    }
    finally {

        saveButton.disabled =
            false;

        saveButton.innerHTML =
            '<span class="validate-icon">✓</span> CONFIRM & SAVE';

    }

}


/* =========================================================
   SAVE SUCCESS
   ========================================================= */

function showSaveSuccess(data) {

    if (receiptId) {

        receiptId.textContent =
            data.receiptId ||
            "-";

    }


    if (successPanel) {

        successPanel.classList.remove(
            "hidden"
        );


        successPanel.scrollIntoView({
            behavior:
                "smooth",

            block:
                "center"
        });

    }


    /*
     * Keep the receipt ID for the next page.
     */

    if (
        viewReceiptButton &&
        data.receiptId
    ) {

        viewReceiptButton.dataset.receiptId =
            data.receiptId;

    }

}


/* =========================================================
   CLEAR COMPLETE FORM
   ========================================================= */

function clearForm() {

    poNumber.value =
        "";

    vendorCode.value =
        "";

    vendorName.value =
        "";

    materialIdentifier.value =
        "";

    quantity.value =
        "";

    uom.value =
        "";

    batch.value =
        "";
    material.value =
        "";

    invoice.value =
        "";

    remarks.value =
        "";


    selectedMaterial =
        null;


    materialResult.classList.add(
        "hidden"
    );


    materialResult.classList.remove(
        "error"
    );


    successPanel.classList.add(
        "hidden"
    );


    poNumber.focus();

}


/* =========================================================
   EVENTS
   ========================================================= */

materialLookup.addEventListener(
    "click",
    lookupMaterial
);


materialClear.addEventListener(
    "click",
    clearMaterial
);


materialIdentifier.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            lookupMaterial();

        }

    }
);


saveButton.addEventListener(
    "click",
    function () {

        console.log("CONFIRM & SAVE CLICKED");

        saveInbound();

    }
);


clearButton.addEventListener(
    "click",
    clearForm
);


/* =========================================================
   VIEW RECEIPT
   ========================================================= */

if (viewReceiptButton) {

    viewReceiptButton.addEventListener(
        "click",
        function () {

            const id =
                viewReceiptButton.dataset.receiptId;


            if (!id) {
                return;
            }


            window.location.href =
                `/inbound-history.html?receiptId=${encodeURIComponent(id)}`;

        }
    );

}


/* =========================================================
   INITIAL FOCUS
   ========================================================= */

window.addEventListener(
    "load",
    function () {

        if (poNumber) {

            poNumber.focus();

        }

    }
);