/* =========================================================
   TITAN MES - INBOUND HISTORY
   ========================================================= */


/* =========================================================
   ELEMENTS
   ========================================================= */

const tableBody =
    document.getElementById("inboundTableBody");

const recordCount =
    document.getElementById("inboundRecordCount");

const searchInput =
    document.getElementById("inboundSearch");

const clearSearch =
    document.getElementById("clearInboundSearch");

const refreshButton =
    document.getElementById("refreshInboundButton");

const emptyPanel =
    document.getElementById("inboundEmptyPanel");


/* Modal */

const receiptModal =
    document.getElementById("receiptModal");

const receiptModalOverlay =
    document.getElementById("receiptModalOverlay");

const closeReceiptModal =
    document.getElementById("closeReceiptModal");

const closeReceiptButton =
    document.getElementById("closeReceiptButton");

const printReceiptButton =
    document.getElementById("printReceiptButton");


/* Receipt fields */

const detailReceiptId =
    document.getElementById("detailReceiptId");

const detailPo =
    document.getElementById("detailPo");

const detailVendorCode =
    document.getElementById("detailVendorCode");

const detailVendorName =
    document.getElementById("detailVendorName");

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


/* QR */

const qrLoading =
    document.getElementById(
        "qrLoading"
    );

const receiptQrCode =
    document.getElementById(
        "receiptQrCode"
    );

const qrReceiptLabel =
    document.getElementById(
        "qrReceiptLabel"
    );


/* =========================================================
   STATE
   ========================================================= */

let inboundRecords = [];

let filteredRecords = [];


/* =========================================================
   LOAD INBOUND RECORDS
   ========================================================= */

async function loadInboundRecords() {

    setTableLoading();


    try {

        const response =
            await fetch(
                "/api/inbound",
                {
                    method: "GET",
                    cache: "no-store"
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
            !response.ok ||
            !data ||
            !data.success
        ) {

            throw new Error(
                data?.message ||
                "Unable to load inbound records."
            );

        }


        inboundRecords =
            Array.isArray(data.inbound)
                ? data.inbound
                : [];


        filteredRecords =
            [...inboundRecords];


        renderTable();

    }
    catch (error) {

        console.error(
            "Inbound history error:",
            error
        );


        showTableError(
            error.message ||
            "Unable to load inbound records."
        );

    }

}


/* =========================================================
   RENDER TABLE
   ========================================================= */

function renderTable() {

    tableBody.innerHTML =
        "";


    recordCount.textContent =
        `${filteredRecords.length} RECORDS`;


    if (
        filteredRecords.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="table-empty">

                    No inbound records found.

                </td>

            </tr>

        `;

        return;

    }


    filteredRecords.forEach(
        function (record) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <strong class="receipt-id-cell">

                        ${escapeHtml(
                record.receiptId
            )}

                    </strong>

                </td>


                <td>

                    ${escapeHtml(
                record.poNumber
            )}

                </td>


                <td>

                    <div class="table-primary">

                        ${escapeHtml(
                record.vendorName
            )}

                    </div>

                    <div class="table-secondary">

                        ${escapeHtml(
                record.vendorCode
            )}

                    </div>

                </td>


                <td>

                    <div class="table-primary">

                        ${escapeHtml(
                record.materialName
            )}

                    </div>

                    <div class="table-secondary">

                        ${escapeHtml(
                record.materialIdentifier
            )}

                    </div>

                </td>


                <td>

                    <strong>

                        ${formatNumber(
                record.quantity
            )}

                    </strong>

                    ${escapeHtml(
                record.unitOfMeasure ||
                ""
            )}

                </td>


                <td>

                    ${escapeHtml(
                record.batchLotNumber ||
                "-"
            )}

                </td>


                <td>

                    ${formatDate(
                record.receiptDate
            )}

                </td>


                <td>

                    <button
                        class="table-action-button"
                        type="button"
                        data-receipt-id="${escapeHtml(
                record.receiptId
            )}">

                        VIEW

                    </button>

                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );


    attachViewButtons();

}


/* =========================================================
   VIEW BUTTONS
   ========================================================= */

function attachViewButtons() {

    const buttons =
        document.querySelectorAll(
            ".table-action-button"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const receiptId =
                        button.dataset.receiptId;


                    if (receiptId) {

                        openReceipt(
                            receiptId
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

function filterRecords() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!search) {

        filteredRecords =
            [...inboundRecords];

    }
    else {

        filteredRecords =
            inboundRecords.filter(
                function (record) {

                    const searchableText = [

                        record.receiptId,

                        record.poNumber,

                        record.vendorCode,

                        record.vendorName,

                        record.materialIdentifier,

                        record.materialName,

                        record.batchLotNumber,

                        record.supplierInvoice,

                        record.remarks

                    ]
                        .filter(
                            value =>
                                value !== null &&
                                value !== undefined
                        )
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        search
                    );

                }
            );

    }


    renderTable();

}


/* =========================================================
   OPEN RECEIPT
   ========================================================= */

async function openReceipt(receiptId) {

    showModal();

    clearReceiptDetails();

    detailReceiptId.textContent =
        receiptId;


    qrReceiptLabel.textContent =
        receiptId;


    qrLoading.classList.remove(
        "hidden"
    );


    receiptQrCode.classList.add(
        "hidden"
    );


    try {

        const response =
            await fetch(
                `/api/inbound/${encodeURIComponent(
                    receiptId
                )}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data ||
            !data.success
        ) {

            throw new Error(
                data?.message ||
                "Receipt not found."
            );

        }


        const inbound =
            data.inbound;


        populateReceipt(
            inbound
        );


        await loadQrCode(
            receiptId
        );

    }
    catch (error) {

        console.error(
            "Receipt details error:",
            error
        );


        qrLoading.textContent =
            error.message ||
            "Unable to load receipt.";

    }

}


/* =========================================================
   POPULATE RECEIPT
   ========================================================= */

function populateReceipt(
    inbound
) {

    detailReceiptId.textContent =
        inbound.receiptId ||
        "-";


    detailPo.textContent =
        inbound.poNumber ||
        "-";


    detailVendorCode.textContent =
        inbound.vendorCode ||
        "-";


    detailVendorName.textContent =
        inbound.vendorName ||
        "-";


    detailMaterialIdentifier.textContent =
        inbound.materialIdentifier ||
        "-";


    detailMaterialName.textContent =
        inbound.materialName ||
        "-";


    detailQuantity.textContent =
        `${formatNumber(
            inbound.quantity
        )} ${inbound.unitOfMeasure ||
        ""
        }`;


    detailUom.textContent =
        inbound.unitOfMeasure ||
        "-";


    detailBatch.textContent =
        inbound.batchLotNumber ||
        "-";


    detailInvoice.textContent =
        inbound.supplierInvoice ||
        "-";


    detailDate.textContent =
        formatDateTime(
            inbound.receiptDate
        );


    detailRemarks.textContent =
        inbound.remarks ||
        "-";


    qrReceiptLabel.textContent =
        inbound.receiptId ||
        "-";

}


/* =========================================================
   LOAD QR CODE
   ========================================================= */

async function loadQrCode(receiptId) {

    qrLoading.classList.remove("hidden");

    qrLoading.textContent =
        "Loading QR code...";

    receiptQrCode.classList.add("hidden");

    receiptQrCode.removeAttribute("src");


    try {

        const response =
            await fetch(
                `/api/inbound/${encodeURIComponent(receiptId)}/qrcode`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data ||
            !data.success ||
            !data.qrCode
        ) {

            throw new Error(
                data?.message ||
                "QR code unavailable."
            );

        }


        /*
         * Backend already gives us:
         *
         * data:image/png;base64,...
         *
         * so we can directly assign it
         * to the image.
         */

        receiptQrCode.src =
            data.qrCode;


        receiptQrCode.alt =
            `QR Code for ${receiptId}`;


        receiptQrCode.onload =
            function () {

                qrLoading.classList.add(
                    "hidden"
                );

                receiptQrCode.classList.remove(
                    "hidden"
                );

            };


        receiptQrCode.onerror =
            function () {

                receiptQrCode.classList.add(
                    "hidden"
                );

                qrLoading.classList.remove(
                    "hidden"
                );

                qrLoading.textContent =
                    "Unable to display QR code.";

            };


    }
    catch (error) {

        console.error(
            "QR code error:",
            error
        );


        receiptQrCode.classList.add(
            "hidden"
        );


        qrLoading.classList.remove(
            "hidden"
        );


        qrLoading.textContent =
            error.message ||
            "Unable to load QR code.";

    }

}


/* =========================================================
   MODAL
   ========================================================= */

function showModal() {

    receiptModal.classList.remove(
        "hidden"
    );


    document.body.classList.add(
        "modal-open"
    );

}
function closeModal() {

    receiptModal.classList.add(
        "hidden"
    );

    document.body.classList.remove(
        "modal-open"
    );

    receiptQrCode.classList.add(
        "hidden"
    );

    receiptQrCode.removeAttribute(
        "src"
    );

}


/* =========================================================
   CLEAR RECEIPT DETAILS
   ========================================================= */

function clearReceiptDetails() {

    detailReceiptId.textContent =
        "-";

    detailPo.textContent =
        "-";

    detailVendorCode.textContent =
        "-";

    detailVendorName.textContent =
        "-";

    detailMaterialIdentifier.textContent =
        "-";

    detailMaterialName.textContent =
        "-";

    detailQuantity.textContent =
        "-";

    detailUom.textContent =
        "-";

    detailBatch.textContent =
        "-";

    detailInvoice.textContent =
        "-";

    detailDate.textContent =
        "-";

    detailRemarks.textContent =
        "-";

}


/* =========================================================
   TABLE LOADING
   ========================================================= */

function setTableLoading() {

    tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="table-loading">

                Loading inbound records...

            </td>

        </tr>

    `;

}


/* =========================================================
   TABLE ERROR
   ========================================================= */

function showTableError(
    message
) {

    tableBody.innerHTML = `

        <tr>

            <td
                colspan="8"
                class="table-error">

                ${escapeHtml(
        message
    )}

            </td>

        </tr>

    `;


    recordCount.textContent =
        "ERROR";

}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";

    }


    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

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
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

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


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   FORMAT DATE + TIME
   ========================================================= */

function formatDateTime(
    value
) {

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
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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


/* =========================================================
   EVENTS
   ========================================================= */

searchInput.addEventListener(
    "input",
    filterRecords
);


clearSearch.addEventListener(
    "click",
    function () {

        searchInput.value =
            "";

        filterRecords();

        searchInput.focus();

    }
);


refreshButton.addEventListener(
    "click",
    loadInboundRecords
);


closeReceiptModal.addEventListener(
    "click",
    closeModal
);


closeReceiptButton.addEventListener(
    "click",
    closeModal
);


receiptModalOverlay.addEventListener(
    "click",
    closeModal
);


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            !receiptModal.classList.contains(
                "hidden"
            )
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   PRINT
   ========================================================= */

printReceiptButton.addEventListener(
    "click",
    function () {

        window.print();

    }
);


/* =========================================================
   INITIAL LOAD
   ========================================================= */

window.addEventListener(
    "load",
    function () {

        loadInboundRecords();

    }
);