console.log("QR GENERATOR JS LOADED");

document.addEventListener("DOMContentLoaded", function () {

    const poInput = document.getElementById("qrPo");
    const soInput = document.getElementById("qrSo");
    const idInput = document.getElementById("qrId");
    const materialNameInput = document.getElementById("qrMaterialName");
    const grnInput = document.getElementById("qrGrn");

    const generateButton = document.getElementById("generateQr");
    const clearButton = document.getElementById("clearQr");
    const downloadButton = document.getElementById("downloadQr");
    const printButton = document.getElementById("printQr");
    const copyButton = document.getElementById("copyPayload");

    const message = document.getElementById("generatorMessage");
    const resultPanel = document.getElementById("qrResult");
    const qrImage = document.getElementById("qrImage");
    const qrPayload = document.getElementById("qrPayload");


    // =====================================================
    // MESSAGE
    // =====================================================

    function showMessage(text, isError) {

        if (!message) {
            return;
        }

        message.textContent = text;

        message.classList.remove("hidden");

        message.classList.toggle(
            "error",
            !!isError
        );
    }


    // =====================================================
    // GENERATE QR
    // =====================================================

    async function generateQr() {

        console.log("GENERATE QR BUTTON CLICKED");


        const po =
            poInput.value.trim();

        const so =
            soInput.value.trim();

        const id =
            idInput.value.trim();

        const mn =
            materialNameInput.value;

        const grn =
            grnInput.value.trim();


        console.log("PO:", po);
        console.log("SO:", so);
        console.log("ID:", id);
        console.log("MN:", mn);
        console.log("GRN:", grn);


        // =================================================
        // VALIDATION
        // =================================================

        if (!po) {

            showMessage(
                "Purchase Order is required.",
                true
            );

            poInput.focus();

            return;
        }


        if (!so) {

            showMessage(
                "Sales Order is required.",
                true
            );

            soInput.focus();

            return;
        }


        if (!id) {

            showMessage(
                "Material Identifier is required.",
                true
            );

            idInput.focus();

            return;
        }


        if (!mn.trim()) {

            showMessage(
                "Material Name is required.",
                true
            );

            materialNameInput.focus();

            return;
        }


        if (!grn) {

            showMessage(
                "GRN is required.",
                true
            );

            grnInput.focus();

            return;
        }


        const oldText =
            generateButton.innerHTML;


        generateButton.disabled =
            true;

        generateButton.textContent =
            "GENERATING...";


        try {

            // =============================================
            // API CALL
            // =============================================

            const response =
                await fetch(
                    "/api/qr-generator/generate",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                po: po,
                                so: so,
                                id: id,
                                mn: mn,
                                grn: grn
                            })
                    }
                );


            console.log(
                "QR API status:",
                response.status
            );


            const text =
                await response.text();


            console.log(
                "QR API response:",
                text
            );


            // =============================================
            // PARSE JSON
            // =============================================

            let result;


            try {

                result =
                    JSON.parse(text);

            }
            catch (e) {

                throw new Error(
                    "Server did not return JSON. HTTP " +
                    response.status
                );

            }


            console.log(
                "QR result:",
                result
            );


            // =============================================
            // CHECK API
            // =============================================

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    result.detail ||
                    "QR generation failed."
                );

            }


            // =============================================
            // CHECK QR RESULT
            // =============================================

            if (!result.qrCode) {

                throw new Error(
                    "QR image was not returned by server."
                );

            }


            if (!result.payload) {

                throw new Error(
                    "QR payload was not returned by server."
                );

            }


            // =============================================
            // SHOW QR
            // =============================================

            qrImage.src =
                result.qrCode;


            qrPayload.value =
                result.payload;


            resultPanel.classList.remove(
                "hidden"
            );


            showMessage(
                "QR code generated successfully."
            );


            console.log(
                "Generated payload:",
                result.payload
            );


            // =============================================
            // SCROLL TO RESULT
            // =============================================

            resultPanel.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
        catch (error) {

            console.error(
                "QR generation error:",
                error
            );


            showMessage(
                error.message ||
                "Unable to generate QR code.",
                true
            );

        }
        finally {

            generateButton.disabled =
                false;

            generateButton.innerHTML =
                oldText;

        }

    }


    // =====================================================
    // CLEAR
    // =====================================================

    function clearForm() {

        console.log(
            "CLEAR BUTTON CLICKED"
        );


        poInput.value = "";
        soInput.value = "";
        idInput.value = "";
        materialNameInput.value = "";
        grnInput.value = "";


        qrImage.removeAttribute(
            "src"
        );


        qrPayload.value = "";


        resultPanel.classList.add(
            "hidden"
        );


        if (message) {

            message.textContent = "";

            message.classList.add(
                "hidden"
            );

            message.classList.remove(
                "error"
            );

        }


        poInput.focus();

    }


    // =====================================================
    // DOWNLOAD QR
    // =====================================================

    function downloadQr() {

        console.log(
            "DOWNLOAD QR CLICKED"
        );


        if (!qrImage.src) {

            showMessage(
                "Generate the QR code first.",
                true
            );

            return;
        }


        const safePo =
            poInput.value
                .trim()
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                );


        const safeId =
            idInput.value
                .trim()
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "_"
                );


        const filename =
            "Material_QR_" +
            safePo +
            "_" +
            safeId +
            ".png";


        const link =
            document.createElement("a");


        link.href =
            qrImage.src;


        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        showMessage(
            "QR code downloaded successfully."
        );

    }


    // =====================================================
    // PRINT
    // =====================================================

    function printQr() {

        console.log(
            "PRINT QR CLICKED"
        );


        if (!qrImage.src) {

            showMessage(
                "Generate the QR code first.",
                true
            );

            return;
        }


        window.print();

    }


    // =====================================================
    // COPY PAYLOAD
    // =====================================================

    async function copyPayload() {

        console.log(
            "COPY PAYLOAD CLICKED"
        );


        if (!qrPayload.value) {

            showMessage(
                "Generate the QR code first.",
                true
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(
                qrPayload.value
            );


            showMessage(
                "QR payload copied successfully."
            );

        }
        catch (error) {

            qrPayload.select();

            document.execCommand(
                "copy"
            );


            showMessage(
                "QR payload copied successfully."
            );

        }

    }


    // =====================================================
    // EVENT HANDLERS
    // =====================================================

    if (!generateButton) {

        console.error(
            "#generateQr button not found."
        );

        return;
    }


    generateButton.addEventListener(
        "click",
        generateQr
    );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearForm
        );

    }


    if (downloadButton) {

        downloadButton.addEventListener(
            "click",
            downloadQr
        );

    }


    if (printButton) {

        printButton.addEventListener(
            "click",
            printQr
        );

    }


    if (copyButton) {

        copyButton.addEventListener(
            "click",
            copyPayload
        );

    }


    console.log(
        "QR GENERATOR READY"
    );

});