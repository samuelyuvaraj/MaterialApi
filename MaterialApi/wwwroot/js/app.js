/* =========================================================
   TITAN MES - APPLICATION JAVASCRIPT
   ========================================================= */


/* =========================================================
   MATERIAL CONSUMPTION
   ========================================================= */

const barcodeInput =
    document.getElementById("materialIdentifier") ||
    document.getElementById("barcodeInput");

const scanButton =
    document.getElementById("materialSearchButton") ||
    document.getElementById("scanButton");

const clearButton =
    document.getElementById("clearButton");

const resultPanel =
    document.getElementById("materialResultPanel") ||
    document.getElementById("resultPanel");

const resultIcon =
    document.getElementById("resultIcon");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const resultStatus =
    document.getElementById("materialStatus") ||
    document.getElementById("resultStatus");

const identifier =
    document.getElementById("materialIdentifierValue") ||
    document.getElementById("identifier");

const revision =
    document.getElementById("materialRevision") ||
    document.getElementById("revision");

const uniqueIdentifier =
    document.getElementById("materialUniqueIdentifier") ||
    document.getElementById("uniqueIdentifier");

const materialName =
    document.getElementById("materialName");

const description =
    document.getElementById("materialDescription") ||
    document.getElementById("description");

const unitOfMeasure =
    document.getElementById("materialUnit") ||
    document.getElementById("unitOfMeasure");

const logisticClass =
    document.getElementById("materialLogisticClass") ||
    document.getElementById("logisticClass");

const materialClass =
    document.getElementById("materialClass");

const volumeValue =
    document.getElementById("materialVolume") ||
    document.getElementById("volumeValue");

const volumeUnit =
    document.getElementById("volumeUnit");

const weightValue =
    document.getElementById("materialWeight") ||
    document.getElementById("weightValue");

const weightUnit =
    document.getElementById("weightUnit");

const lastScan =
    document.getElementById("lastScan");

const clock =
    document.getElementById("clock");


/* =========================================================
   SCAN MATERIAL
   ========================================================= */

async function scanMaterial() {

    if (!barcodeInput) {
        return;
    }


    const value =
        barcodeInput.value.trim();


    if (!value) {

        barcodeInput.focus();

        return;
    }


    setLoading(true);


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
            data?.success
        ) {

            showMaterial(
                data.material
            );

        }
        else {

            showError(
                data?.message ||
                "Material not found."
            );

        }

    }
    catch (error) {

        console.error(
            "Material API error:",
            error
        );


        showError(
            "Unable to connect to Material API."
        );

    }
    finally {

        setLoading(false);

        barcodeInput.focus();

    }

}


/* =========================================================
   SHOW MATERIAL
   ========================================================= */

function showMaterial(material) {

    if (!resultPanel) {
        return;
    }


    resultPanel.classList.remove(
        "hidden",
        "error"
    );


    if (resultIcon) {

        resultIcon.textContent =
            "✓";

    }


    if (resultTitle) {

        resultTitle.textContent =
            "Material Found";

    }


    if (resultMessage) {

        resultMessage.textContent =
            "Material successfully identified.";

    }


    if (resultStatus) {

        resultStatus.textContent =
            "AVAILABLE";

    }


    if (identifier) {

        identifier.textContent =
            material?.identifier || "-";

    }


    if (revision) {

        revision.textContent =
            material?.revision || "-";

    }


    if (uniqueIdentifier) {

        uniqueIdentifier.textContent =
            material?.uniqueIdentifier || "-";

    }


    if (materialName) {

        materialName.textContent =
            material?.name || "-";

    }


    if (description) {

        description.textContent =
            material?.description || "-";

    }


    if (unitOfMeasure) {

        unitOfMeasure.textContent =
            material?.unitOfMeasure || "-";

    }


    if (logisticClass) {

        logisticClass.textContent =
            material?.logisticClassIdentifier || "-";

    }


    if (materialClass) {

        materialClass.textContent =
            material?.materialClass || "-";

    }


    if (volumeValue) {

        if (
            volumeValue.id ===
            "materialVolume"
        ) {

            volumeValue.textContent =
                material?.volumeValue != null
                    ? `${formatNumber(material.volumeValue)} ${material?.volumeUnitOfMeasure || ""}`
                    : "-";

        }
        else {

            volumeValue.textContent =
                formatNumber(
                    material?.volumeValue
                );

        }

    }


    if (volumeUnit) {

        volumeUnit.textContent =
            material?.volumeUnitOfMeasure || "";

    }


    if (weightValue) {

        if (
            weightValue.id ===
            "materialWeight"
        ) {

            weightValue.textContent =
                material?.weightValue != null
                    ? `${formatNumber(material.weightValue)} ${material?.weightUnitOfMeasure || ""}`
                    : "-";

        }
        else {

            weightValue.textContent =
                formatNumber(
                    material?.weightValue
                );

        }

    }


    if (weightUnit) {

        weightUnit.textContent =
            material?.weightUnitOfMeasure || "";

    }


    if (lastScan) {

        lastScan.textContent =
            `Last Scan: ${material?.identifier || "-"}`;

    }


    /*
     * Current HTML has a separate empty panel.
     */

    const emptyPanel =
        document.getElementById(
            "materialEmptyPanel"
        );


    if (emptyPanel) {

        emptyPanel.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   SHOW ERROR
   ========================================================= */

function showError(message) {

    if (!resultPanel) {
        return;
    }


    resultPanel.classList.remove(
        "hidden"
    );


    resultPanel.classList.add(
        "error"
    );


    if (resultIcon) {

        resultIcon.textContent =
            "×";

    }


    if (resultTitle) {

        resultTitle.textContent =
            "Material Not Found";

    }


    if (resultMessage) {

        resultMessage.textContent =
            message;

    }


    if (resultStatus) {

        resultStatus.textContent =
            "ERROR";

    }


    const scannedValue =
        barcodeInput
            ? barcodeInput.value.trim()
            : "";


    if (identifier) {

        identifier.textContent =
            "-";

    }


    if (revision) {

        revision.textContent =
            "-";

    }


    if (uniqueIdentifier) {

        uniqueIdentifier.textContent =
            scannedValue || "-";

    }


    if (materialName) {

        materialName.textContent =
            "-";

    }


    if (description) {

        description.textContent =
            "-";

    }


    if (unitOfMeasure) {

        unitOfMeasure.textContent =
            "-";

    }


    if (logisticClass) {

        logisticClass.textContent =
            "-";

    }


    if (materialClass) {

        materialClass.textContent =
            "-";

    }


    if (volumeValue) {

        volumeValue.textContent =
            "-";

    }


    if (volumeUnit) {

        volumeUnit.textContent =
            "";

    }


    if (weightValue) {

        weightValue.textContent =
            "-";

    }


    if (weightUnit) {

        weightUnit.textContent =
            "";

    }


    if (lastScan) {

        lastScan.textContent =
            `Last Scan: ${scannedValue || "-"}`;

    }


    const emptyPanel =
        document.getElementById(
            "materialEmptyPanel"
        );


    if (emptyPanel) {

        emptyPanel.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   CLEAR MATERIAL
   ========================================================= */

function clearScan() {

    if (barcodeInput) {

        barcodeInput.value =
            "";

        barcodeInput.focus();

    }


    if (resultPanel) {

        resultPanel.classList.add(
            "hidden"
        );

        resultPanel.classList.remove(
            "error"
        );

    }


    const emptyPanel =
        document.getElementById(
            "materialEmptyPanel"
        );


    if (emptyPanel) {

        emptyPanel.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(isLoading) {

    if (!scanButton) {
        return;
    }


    scanButton.disabled =
        isLoading;


    if (isLoading) {

        scanButton.innerHTML =
            "VALIDATING...";

    }
    else {

        /*
         * Support both old and current UI.
         */

        if (
            scanButton.id ===
            "materialSearchButton"
        ) {

            scanButton.innerHTML =
                "SEARCH";

        }
        else {

            scanButton.innerHTML =
                '<span class="validate-icon">✓</span> VALIDATE';

        }

    }

}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {

        return value;

    }


    return number.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 4
        }
    );

}


/* =========================================================
   MATERIAL KEYBOARD / SCANNER
   ========================================================= */

if (barcodeInput) {

    barcodeInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                scanMaterial();

            }

        }
    );

}


if (scanButton) {

    scanButton.addEventListener(
        "click",
        scanMaterial
    );

}


if (clearButton) {

    clearButton.addEventListener(
        "click",
        clearScan
    );

}


/* =========================================================
   INBOUND PAGE ELEMENTS
   ========================================================= */

const materialPage =
    document.getElementById(
        "materialPage"
    );


const inboundReceivePage =
    document.getElementById(
        "inboundReceivePage"
    );

const inboundHistoryPage =
    document.getElementById(
        "inboundHistoryPage"
    );


const navItems =
    document.querySelectorAll(
        ".nav-item[data-page]"
    );


/* =========================================================
   INBOUND FORM
   ========================================================= */

const inboundPoNumber =
    document.getElementById(
        "inboundPoNumber"
    );

const inboundVendorCode =
    document.getElementById(
        "inboundVendorCode"
    );

const inboundVendorName =
    document.getElementById(
        "inboundVendorName"
    );

const inboundMaterialIdentifier =
    document.getElementById(
        "inboundMaterialIdentifier"
    );

const inboundQuantity =
    document.getElementById(
        "inboundQuantity"
    );

const inboundUom =
    document.getElementById(
        "inboundUom"
    );

const inboundBatch =
    document.getElementById(
        "inboundBatch"
    );

const inboundInvoice =
    document.getElementById(
        "inboundInvoice"
    );

const inboundRemarks =
    document.getElementById(
        "inboundRemarks"
    );

const inboundMaterialLookup =
    document.getElementById(
        "inboundMaterialLookup"
    );

const inboundSaveButton =
    document.getElementById(
        "inboundSaveButton"
    );

const inboundClearButton =
    document.getElementById(
        "inboundClearButton"
    );


let inboundMaterial =
    null;


/* =========================================================
   INBOUND MATERIAL RESULT
   ========================================================= */

const inboundMaterialResult =
    document.getElementById(
        "inboundMaterialResult"
    );

const inboundMaterialName =
    document.getElementById(
        "inboundMaterialName"
    );

const inboundResultIdentifier =
    document.getElementById(
        "inboundResultIdentifier"
    );

const inboundResultUom =
    document.getElementById(
        "inboundResultUom"
    );

const inboundResultClass =
    document.getElementById(
        "inboundResultClass"
    );


/* =========================================================
   INBOUND HISTORY
   ========================================================= */

const inboundTableBody =
    document.getElementById(
        "inboundTableBody"
    );

const inboundRecordCount =
    document.getElementById(
        "inboundRecordCount"
    );

const inboundSearch =
    document.getElementById(
        "inboundSearch"
    );

const refreshInboundButton =
    document.getElementById(
        "refreshInboundButton"
    );

const newInboundButton =
    document.getElementById(
        "newInboundButton"
    );


let inboundRecords =
    [];


/* =========================================================
   INBOUND SUCCESS
   ========================================================= */

const inboundSuccessPanel =
    document.getElementById(
        "inboundSuccessPanel"
    );

const createdReceiptId =
    document.getElementById(
        "createdReceiptId"
    );

const viewCreatedReceipt =
    document.getElementById(
        "viewCreatedReceipt"
    );


/* =========================================================
   RECEIPT MODAL
   ========================================================= */

const receiptModal =
    document.getElementById(
        "receiptModal"
    );

const closeReceiptModal =
    document.getElementById(
        "closeReceiptModal"
    );

const closeReceiptButton =
    document.getElementById(
        "closeReceiptButton"
    );

const printReceiptButton =
    document.getElementById(
        "printReceiptButton"
    );


const detailReceiptId =
    document.getElementById(
        "detailReceiptId"
    );

const detailPo =
    document.getElementById(
        "detailPo"
    );

const detailVendorCode =
    document.getElementById(
        "detailVendorCode"
    );

const detailVendorName =
    document.getElementById(
        "detailVendorName"
    );

const detailMaterialIdentifier =
    document.getElementById(
        "detailMaterialIdentifier"
    );

const detailMaterialName =
    document.getElementById(
        "detailMaterialName"
    );

const detailQuantity =
    document.getElementById(
        "detailQuantity"
    );

const detailUom =
    document.getElementById(
        "detailUom"
    );

const detailBatch =
    document.getElementById(
        "detailBatch"
    );

const detailInvoice =
    document.getElementById(
        "detailInvoice"
    );

const detailDate =
    document.getElementById(
        "detailDate"
    );

const detailRemarks =
    document.getElementById(
        "detailRemarks"
    );


const receiptQrCode =
    document.getElementById(
        "receiptQrCode"
    );

const qrLoading =
    document.getElementById(
        "qrLoading"
    );

const qrReceiptLabel =
    document.getElementById(
        "qrReceiptLabel"
    );


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

navItems.forEach(
    item => {

        item.addEventListener(
            "click",
            function () {

                const page =
                    item.dataset.page;


                navItems.forEach(
                    nav => {

                        nav.classList.remove(
                            "active"
                        );

                    }
                );


                item.classList.add(
                    "active"
                );


                showPage(page);

            }
        );

    }
);


function showPage(page) {

    if (materialPage) {

        materialPage.classList.add(
            "hidden"
        );

    }


    if (inboundReceivePage) {

        inboundReceivePage.classList.add(
            "hidden"
        );

    }


    if (inboundHistoryPage) {

        inboundHistoryPage.classList.add(
            "hidden"
        );

    }


    if (
        page ===
        "material"
    ) {

        if (materialPage) {

            materialPage.classList.remove(
                "hidden"
            );

        }


        if (barcodeInput) {

            barcodeInput.focus();

        }

    }


    if (
        page ===
        "inbound-receive"
    ) {

        if (inboundReceivePage) {

            inboundReceivePage.classList.remove(
                "hidden"
            );

        }


        if (inboundPoNumber) {

            inboundPoNumber.focus();

        }

    }


    if (
        page ===
        "inbound-history"
    ) {

        if (inboundHistoryPage) {

            inboundHistoryPage.classList.remove(
                "hidden"
            );

        }


        loadInboundRecords();

    }

}


/* =========================================================
   INBOUND MATERIAL LOOKUP
   ========================================================= */

async function lookupInboundMaterial() {

    if (!inboundMaterialIdentifier) {
        return;
    }


    const value =
        inboundMaterialIdentifier
            .value
            .trim();


    if (!value) {

        inboundMaterialIdentifier.focus();

        return;

    }


    if (inboundMaterialLookup) {

        inboundMaterialLookup.disabled =
            true;

        inboundMaterialLookup.textContent =
            "LOOKING...";

    }


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
            data?.success
        ) {

            inboundMaterial =
                data.material;


            if (inboundMaterialName) {

                inboundMaterialName.textContent =
                    inboundMaterial.name ||
                    "-";

            }


            if (inboundResultIdentifier) {

                inboundResultIdentifier.textContent =
                    inboundMaterial.identifier ||
                    "-";

            }


            if (inboundResultUom) {

                inboundResultUom.textContent =
                    inboundMaterial.unitOfMeasure ||
                    "-";

            }


            if (inboundResultClass) {

                inboundResultClass.textContent =
                    inboundMaterial.materialClass ||
                    "-";

            }


            if (inboundUom) {

                inboundUom.value =
                    inboundMaterial.unitOfMeasure ||
                    "";

            }


            if (inboundMaterialResult) {

                inboundMaterialResult.classList.remove(
                    "hidden"
                );

            }

        }
        else {

            inboundMaterial =
                null;


            if (inboundMaterialResult) {

                inboundMaterialResult.classList.add(
                    "hidden"
                );

            }


            alert(
                data?.message ||
                "Material not found."
            );

        }

    }
    catch (error) {

        console.error(
            "Inbound material lookup error:",
            error
        );


        inboundMaterial =
            null;


        alert(
            "Unable to connect to Material API."
        );

    }
    finally {

        if (inboundMaterialLookup) {

            inboundMaterialLookup.disabled =
                false;

            inboundMaterialLookup.textContent =
                "LOOKUP";

        }


        inboundMaterialIdentifier.focus();

    }

}


if (inboundMaterialIdentifier) {

    inboundMaterialIdentifier.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                lookupInboundMaterial();

            }

        }
    );

}


if (inboundMaterialLookup) {

    inboundMaterialLookup.addEventListener(
        "click",
        lookupInboundMaterial
    );

}


/* =========================================================
   SAVE INBOUND
   ========================================================= */

async function saveInbound() {

    if (!inboundSaveButton) {
        return;
    }


    const poNumber =
        inboundPoNumber.value.trim();

    const vendorCode =
        inboundVendorCode.value.trim();

    const vendorName =
        inboundVendorName.value.trim();

    const materialIdentifier =
        inboundMaterialIdentifier.value.trim();

    const quantity =
        Number(
            inboundQuantity.value
        );


    if (!poNumber) {

        alert(
            "PO Number is required."
        );

        inboundPoNumber.focus();

        return;

    }


    if (!vendorName) {

        alert(
            "Vendor Name is required."
        );

        inboundVendorName.focus();

        return;

    }


    if (!materialIdentifier) {

        alert(
            "Material Identifier is required."
        );

        inboundMaterialIdentifier.focus();

        return;

    }


    /*
     * Make sure material has actually
     * been validated.
     */

    if (
        !inboundMaterial ||
        inboundMaterial.identifier !==
        materialIdentifier
    ) {

        await lookupInboundMaterial();


        if (!inboundMaterial) {

            return;

        }

    }


    if (
        !quantity ||
        quantity <= 0
    ) {

        alert(
            "Quantity must be greater than zero."
        );

        inboundQuantity.focus();

        return;

    }


    const requestBody = {

        poNumber:
            poNumber,

        vendorCode:
            vendorCode,

        vendorName:
            vendorName,

        materialIdentifier:
            materialIdentifier,

        quantity:
            quantity,

        batchLotNumber:
            inboundBatch.value.trim(),

        supplierInvoice:
            inboundInvoice.value.trim(),

        remarks:
            inboundRemarks.value.trim()

    };


    inboundSaveButton.disabled =
        true;


    inboundSaveButton.textContent =
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
            data?.success
        ) {

            if (createdReceiptId) {

                createdReceiptId.textContent =
                    data.receiptId;

            }


            if (viewCreatedReceipt) {

                viewCreatedReceipt.dataset.receiptId =
                    data.receiptId;

            }


            if (inboundSuccessPanel) {

                inboundSuccessPanel.classList.remove(
                    "hidden"
                );


                inboundSuccessPanel.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "center"
                });

            }

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

        inboundSaveButton.disabled =
            false;

        inboundSaveButton.innerHTML =
            "✓ &nbsp; CONFIRM & SAVE";

    }

}


if (inboundSaveButton) {

    inboundSaveButton.addEventListener(
        "click",
        saveInbound
    );

}


/* =========================================================
   CLEAR INBOUND FORM
   ========================================================= */

function clearInboundForm() {

    if (inboundPoNumber) {

        inboundPoNumber.value =
            "";

    }


    if (inboundVendorCode) {

        inboundVendorCode.value =
            "";

    }


    if (inboundVendorName) {

        inboundVendorName.value =
            "";

    }


    if (inboundMaterialIdentifier) {

        inboundMaterialIdentifier.value =
            "";

    }


    if (inboundQuantity) {

        inboundQuantity.value =
            "";

    }


    if (inboundUom) {

        inboundUom.value =
            "";

    }


    if (inboundBatch) {

        inboundBatch.value =
            "";

    }


    if (inboundInvoice) {

        inboundInvoice.value =
            "";

    }


    if (inboundRemarks) {

        inboundRemarks.value =
            "";

    }


    inboundMaterial =
        null;


    if (inboundMaterialResult) {

        inboundMaterialResult.classList.add(
            "hidden"
        );

    }


    if (inboundSuccessPanel) {

        inboundSuccessPanel.classList.add(
            "hidden"
        );

    }


    if (inboundPoNumber) {

        inboundPoNumber.focus();

    }

}


if (inboundClearButton) {

    inboundClearButton.addEventListener(
        "click",
        clearInboundForm
    );

}


/* =========================================================
   LOAD INBOUND HISTORY
   ========================================================= */

async function loadInboundRecords() {

    if (!inboundTableBody) {
        return;
    }


    inboundTableBody.innerHTML = `
        <tr>
            <td colspan="8" class="table-loading">
                Loading inbound records...
            </td>
        </tr>
    `;


    try {

        const response =
            await fetch(
                "/api/inbound"
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
            data?.success
        ) {

            inboundRecords =
                data.inbound ||
                [];


            renderInboundTable(
                inboundRecords
            );

        }
        else {

            throw new Error(
                data?.message ||
                "Unable to load records."
            );

        }

    }
    catch (error) {

        console.error(
            "Inbound history error:",
            error
        );


        inboundTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    Unable to load inbound records.
                </td>
            </tr>
        `;


        if (inboundRecordCount) {

            inboundRecordCount.textContent =
                "Unable to load records";

        }

    }

}


/* =========================================================
   RENDER INBOUND TABLE
   ========================================================= */

function renderInboundTable(records) {

    if (!inboundTableBody) {
        return;
    }


    if (inboundRecordCount) {

        inboundRecordCount.textContent =
            `${records.length} receipt(s)`;

    }


    if (!records.length) {

        inboundTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="table-loading">
                    No inbound goods found.
                </td>
            </tr>
        `;

        return;

    }


    inboundTableBody.innerHTML =
        records
            .map(
                record => `

                <tr
                    data-receipt-id="${escapeHtml(record.receiptId)}">

                    <td class="receipt-id-cell">
                        ${escapeHtml(record.receiptId)}
                    </td>

                    <td>
                        ${escapeHtml(record.poNumber)}
                    </td>

                    <td>
                        ${escapeHtml(record.vendorName)}
                    </td>

                    <td>
                        <span class="material-id-cell">
                            ${escapeHtml(record.materialIdentifier)}
                        </span>

                        <br>

                        ${escapeHtml(record.materialName)}
                    </td>

                    <td class="quantity-cell">
                        ${escapeHtml(record.quantity)}
                        ${escapeHtml(record.unitOfMeasure)}
                    </td>

                    <td>
                        ${escapeHtml(record.batchLotNumber || "-")}
                    </td>

                    <td>
                        ${formatInboundDate(record.receiptDate)}
                    </td>

                    <td>
                        <span class="table-action">
                            VIEW
                        </span>
                    </td>

                </tr>
                `
            )
            .join("");


    document
        .querySelectorAll(
            "#inboundTableBody tr[data-receipt-id]"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    function () {

                        openReceipt(
                            row.dataset.receiptId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SEARCH INBOUND
   ========================================================= */

if (inboundSearch) {

    inboundSearch.addEventListener(
        "input",
        function () {

            const search =
                inboundSearch
                    .value
                    .trim()
                    .toLowerCase();


            if (!search) {

                renderInboundTable(
                    inboundRecords
                );

                return;

            }


            const filtered =
                inboundRecords.filter(
                    record => {

                        return [

                            record.receiptId,

                            record.poNumber,

                            record.vendorCode,

                            record.vendorName,

                            record.materialIdentifier,

                            record.materialName,

                            record.batchLotNumber,

                            record.supplierInvoice

                        ]
                            .some(
                                value =>
                                    String(
                                        value ||
                                        ""
                                    )
                                        .toLowerCase()
                                        .includes(
                                            search
                                        )
                            );

                    }
                );


            renderInboundTable(
                filtered
            );

        }
    );

}


if (refreshInboundButton) {

    refreshInboundButton.addEventListener(
        "click",
        loadInboundRecords
    );

}


/* =========================================================
   NEW INBOUND
   ========================================================= */

if (newInboundButton) {

    newInboundButton.addEventListener(
        "click",
        function () {

            clearInboundForm();


            navItems.forEach(
                nav => {

                    nav.classList.remove(
                        "active"
                    );

                }
            );


            const receiveNav =
                document.querySelector(
                    '.nav-item[data-page="inbound-receive"]'
                );


            if (receiveNav) {

                receiveNav.classList.add(
                    "active"
                );

            }


            showPage(
                "inbound-receive"
            );

        }
    );

}


/* =========================================================
   OPEN RECEIPT
   ========================================================= */

async function openReceipt(receiptId) {

    if (!receiptModal) {
        return;
    }


    receiptModal.classList.remove(
        "hidden"
    );


    if (qrLoading) {

        qrLoading.classList.remove(
            "hidden"
        );

        qrLoading.textContent =
            "Generating QR code...";

    }


    if (receiptQrCode) {

        receiptQrCode.classList.add(
            "hidden"
        );

    }


    try {

        const response =
            await fetch(
                `/api/inbound/${encodeURIComponent(receiptId)}`
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
            !response.ok ||
            !data?.success
        ) {

            throw new Error(
                data?.message ||
                "Receipt not found."
            );

        }


        populateReceiptDetails(
            data.inbound
        );


        await loadReceiptQrCode(
            receiptId
        );

    }
    catch (error) {

        console.error(
            "Receipt details error:",
            error
        );


        alert(
            error.message ||
            "Unable to load receipt details."
        );


        closeReceipt();

    }

}


/* =========================================================
   POPULATE RECEIPT DETAILS
   ========================================================= */

function populateReceiptDetails(
    inbound
) {

    if (detailReceiptId) {

        detailReceiptId.textContent =
            inbound.receiptId || "-";

    }


    if (detailPo) {

        detailPo.textContent =
            inbound.poNumber || "-";

    }


    if (detailVendorCode) {

        detailVendorCode.textContent =
            inbound.vendorCode || "-";

    }


    if (detailVendorName) {

        detailVendorName.textContent =
            inbound.vendorName || "-";

    }


    if (detailMaterialIdentifier) {

        detailMaterialIdentifier.textContent =
            inbound.materialIdentifier || "-";

    }


    if (detailMaterialName) {

        detailMaterialName.textContent =
            inbound.materialName || "-";

    }


    if (detailQuantity) {

        detailQuantity.textContent =
            inbound.quantity ?? "-";

    }


    if (detailUom) {

        detailUom.textContent =
            inbound.unitOfMeasure || "-";

    }


    if (detailBatch) {

        detailBatch.textContent =
            inbound.batchLotNumber || "-";

    }


    if (detailInvoice) {

        detailInvoice.textContent =
            inbound.supplierInvoice || "-";

    }


    if (detailDate) {

        detailDate.textContent =
            formatInboundDate(
                inbound.receiptDate
            );

    }


    if (detailRemarks) {

        detailRemarks.textContent =
            inbound.remarks || "-";

    }


    if (qrReceiptLabel) {

        qrReceiptLabel.textContent =
            inbound.receiptId || "-";

    }

}


/* =========================================================
   LOAD QR CODE
   ========================================================= */

async function loadReceiptQrCode(
    receiptId
) {

    if (!qrLoading) {
        return;
    }


    qrLoading.classList.remove(
        "hidden"
    );


    qrLoading.textContent =
        "Generating QR code...";


    if (receiptQrCode) {

        receiptQrCode.classList.add(
            "hidden"
        );

    }


    try {

        const response =
            await fetch(
                `/api/inbound/${encodeURIComponent(receiptId)}/qrcode`
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
            !response.ok ||
            !data?.success
        ) {

            throw new Error(
                data?.message ||
                "QR code generation failed."
            );

        }


        if (!receiptQrCode) {
            return;
        }


        receiptQrCode.onload =
            function () {

                qrLoading.classList.add(
                    "hidden"
                );


                receiptQrCode.classList.remove(
                    "hidden"
                );

            };


        receiptQrCode.src =
            data.qrCode;

    }
    catch (error) {

        console.error(
            "QR error:",
            error
        );


        qrLoading.textContent =
            "Unable to generate QR code.";

    }

}


/* =========================================================
   CLOSE RECEIPT
   ========================================================= */

function closeReceipt() {

    if (receiptModal) {

        receiptModal.classList.add(
            "hidden"
        );

    }

}


if (closeReceiptModal) {

    closeReceiptModal.addEventListener(
        "click",
        closeReceipt
    );

}


if (closeReceiptButton) {

    closeReceiptButton.addEventListener(
        "click",
        closeReceipt
    );

}


const receiptModalOverlay =
    document.querySelector(
        ".receipt-modal-overlay"
    );


if (receiptModalOverlay) {

    receiptModalOverlay.addEventListener(
        "click",
        closeReceipt
    );

}


/* =========================================================
   PRINT RECEIPT
   ========================================================= */

if (printReceiptButton) {

    printReceiptButton.addEventListener(
        "click",
        function () {

            window.print();

        }
    );

}


/* =========================================================
   CREATED RECEIPT
   ========================================================= */

if (viewCreatedReceipt) {

    viewCreatedReceipt.addEventListener(
        "click",
        function () {

            const receiptId =
                viewCreatedReceipt.dataset.receiptId;


            if (!receiptId) {

                return;

            }


            openReceipt(
                receiptId
            );

        }
    );

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatInboundDate(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


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


/* =========================================================
   CLOCK
   ========================================================= */

function updateClock() {

    /*
     * Current HTML
     */

    const currentDate =
        document.getElementById(
            "currentDate"
        );

    const currentTime =
        document.getElementById(
            "currentTime"
        );


    /*
     * Older HTML compatibility
     */

    const legacyClock =
        document.getElementById(
            "clock"
        );


    const now =
        new Date();


    if (currentDate) {

        currentDate.textContent =
            now.toLocaleDateString(
                "en-IN",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            );

    }


    if (currentTime) {

        currentTime.textContent =
            now.toLocaleTimeString(
                "en-IN",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit",

                    hour12:
                        false
                }
            );

    }


    if (legacyClock) {

        legacyClock.textContent =
            now.toLocaleString(
                "en-IN",
                {
                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            );

    }

}


setInterval(
    updateClock,
    1000
);


updateClock();


/* =========================================================
   INITIAL FOCUS
   ========================================================= */

window.addEventListener(
    "load",
    function () {

        /*
         * Start on Material Consumption.
         */

        showPage(
            "material"
        );


        if (barcodeInput) {

            barcodeInput.focus();

        }

    }
);