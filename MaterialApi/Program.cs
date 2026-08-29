
using MaterialApi.Models;
using MaterialApi.Services;
using QRCoder;
 



var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://0.0.0.0:5046");

builder.Services.AddSingleton<ExcelMaterialService>();
builder.Services.AddSingleton<InboundGoodsService>();
builder.Services.AddSingleton<ConsumptionService>();
builder.Services.AddSingleton<MaterialApi.Services.IGQCGradeService>();
builder.Services.AddSingleton<MaterialApi.Services.IGQCTestingService>();
builder.Services.AddSingleton<MaterialApi.Services.ChemicalLabService>();


var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/", () =>
{
    return Results.Redirect("/index.html");
});


/* =========================================================
   MATERIAL
   ========================================================= */

app.MapGet(
    "/api/material/{identifier}",
    (
        string identifier,
        ExcelMaterialService materialService) =>
    {
        if (string.IsNullOrWhiteSpace(identifier))
        {
            return Results.BadRequest(new
            {
                success = false,
                message = "Identifier is required."
            });
        }

        try
        {
            var material =
                materialService.GetMaterialByIdentifier(
                    identifier);

            if (material == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    identifier,
                    message = "Material not found."
                });
            }

            return Results.Ok(new
            {
                success = true,
                message = "Material found.",
                material
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Material API Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


/* =========================================================
   GET ALL INBOUND
   ========================================================= */

app.MapGet(
    "/api/inbound",
    (
        InboundGoodsService inboundService) =>
    {
        try
        {
            var records =
                inboundService.GetAllInbound();

            return Results.Ok(new
            {
                success = true,
                count = records.Count,
                inbound = records
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Inbound Goods API Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


/* =========================================================
   GET INBOUND BY RECEIPT
   ========================================================= */

app.MapGet(
    "/api/inbound/{receiptId}",
    (
        string receiptId,
        InboundGoodsService inboundService) =>
    {
        try
        {
            var inbound =
                inboundService.GetInboundByReceiptId(
                    receiptId);

            if (inbound == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = "Inbound receipt not found."
                });
            }

            return Results.Ok(new
            {
                success = true,
                inbound
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Inbound Goods API Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


/* =========================================================
   SAVE INBOUND
   ========================================================= */

app.MapPost(
    "/api/inbound",
    (
        InboundGoods inbound,
        InboundGoodsService inboundService) =>
    {
        try
        {
            var saved =
                inboundService.SaveInbound(
                    inbound);

            return Results.Ok(new
            {
                success = true,

                message =
                    "Inbound goods received successfully.",

                receiptId =
                    saved.ReceiptId,

                material = new
                {
                    identifier =
                        saved.MaterialIdentifier,

                    name =
                        saved.MaterialName,

                    unitOfMeasure =
                        saved.UnitOfMeasure
                },

                inbound = saved
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Inbound Goods API Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });
    

/* =========================================================
   QR CODE
   ========================================================= */

app.MapGet(
    "/api/inbound/{receiptId}/qrcode",
    (
        string receiptId,
        InboundGoodsService inboundService) =>
    {
        try
        {
            var inbound =
                inboundService.GetInboundByReceiptId(
                    receiptId);

            if (inbound == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = "Inbound receipt not found."
                });
            }

            using var qrGenerator =
                new QRCodeGenerator();

            using var qrData =
                qrGenerator.CreateQrCode(
                    inbound.ReceiptId,
                    QRCodeGenerator.ECCLevel.Q);

            var pngQrCode =
                new PngByteQRCode(qrData);

            byte[] qrBytes =
                pngQrCode.GetGraphic(10);

            var base64 =
                Convert.ToBase64String(qrBytes);

            return Results.Ok(new
            {
                success = true,

                receiptId =
                    inbound.ReceiptId,

                qrCode =
                    $"data:image/png;base64,{base64}"
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "QR Code Generation Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });
// =========================================================
// CONSUMPTION - QR SCAN
// =========================================================

app.MapPost(
    "/api/consumption/scan",
    (
        QRScanRequest request,
        ConsumptionService consumptionService) =>
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.QrData))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "QR data is required."
                });
            }

            var parts =
                request.QrData.Split(
                    '|',
                    StringSplitOptions.None);

            // R1|PO|SO|ID|MN|GRN
            if (parts.Length != 6)
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message =
                        "Invalid R1 QR format. Expected: R1|PO|SO|ID|MN|GRN"
                });
            }

            var version =
                parts[0].Trim();

            if (!string.Equals(
                    version,
                    "R1",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message =
                        $"Unsupported QR version: {version}"
                });
            }

            var po =
                parts[1].Trim();

            var so =
                parts[2].Trim();

            var id =
                parts[3].Trim();

            // Do NOT truncate this.
            // Material names can be 350+ characters.
            var materialName =
                parts[4];

            var grn =
                parts[5].Trim();

            if (string.IsNullOrWhiteSpace(po) ||
                string.IsNullOrWhiteSpace(so) ||
                string.IsNullOrWhiteSpace(id) ||
                string.IsNullOrWhiteSpace(materialName) ||
                string.IsNullOrWhiteSpace(grn))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message =
                        "QR contains one or more empty fields."
                });
            }

            return Results.Ok(new
            {
                success = true,

                version,

                qrData = new
                {
                    po,
                    so,
                    id,
                    mn = materialName,
                    grn
                }
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "QR Scan Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


// =========================================================
// CONSUMPTION - CONFIRM QR
// =========================================================

app.MapPost(
    "/api/consumption/confirm",
    (
        ConsumptionConfirmRequest request,
        ConsumptionService consumptionService) =>
    {
        try
        {
            var record =
                consumptionService.FindByQrData(
                    request.Po,
                    request.So,
                    request.Id,
                    request.Grn);

            if (record == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = "No related consumption record found."
                });
            }

            return Results.Ok(new
            {
                success = true,
                message = "Consumption record found.",
                consumption = record
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Consumption Confirmation Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


// =========================================================
// CONSUMPTION - CONSUME QUANTITY
// =========================================================

app.MapPost(
    "/api/consumption/consume",
    (
        ConsumptionRequest request,
        ConsumptionService consumptionService) =>
    {
        try
        {
            if (request.Quantity <= 0)
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message =
                        "Consumption quantity must be greater than zero."
                });
            }

            var result =
                consumptionService.Consume(
                    request.Po,
                    request.So,
                    request.Id,
                    request.Grn,
                    request.Quantity);

            return Results.Ok(new
            {
                success = true,
                message =
                    "Material consumed successfully.",
                consumption = result
            });
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(new
            {
                success = false,
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Consumption Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


// =========================================================
// CONSUMPTION - HISTORY
// =========================================================

app.MapGet(
    "/api/consumption",
    (
        ConsumptionService consumptionService) =>
    {
        try
        {
            var records =
                consumptionService.GetAll();

            return Results.Ok(new
            {
                success = true,
                count = records.Count,
                consumption = records
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Consumption History Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });
app.MapGet(
    "/api/consumption/debug",
    (ConsumptionService consumptionService) =>
    {
        var records = consumptionService.GetAll();

        return Results.Ok(new
        {
            count = records.Count,
            records
        });
    });

// =========================================================
// QR GENERATOR
// =========================================================

app.MapPost(
    "/api/qr-generator/generate",
    (
        QrGeneratorRequest request) =>
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Po))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "Purchase Order is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.So))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "Sales Order is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Id))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "Material Identifier is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Mn))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "Material Name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Grn))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "GRN is required."
                });
            }


            // =================================================
            // QR PAYLOAD
            //
            // R1 gives future flexibility to add more fields.
            //
            // R1|PO|SO|ID|MN|GRN
            // =================================================

            var payload =
                string.Join(
                    "|",
                    "R1",
                    request.Po.Trim(),
                    request.So.Trim(),
                    request.Id.Trim(),
                    request.Mn,
                    request.Grn.Trim()
                );


            // =================================================
            // QR GENERATION
            // =================================================

            using var qrGenerator =
                new QRCodeGenerator();


            using var qrData =
                qrGenerator.CreateQrCode(
                    payload,
                    QRCodeGenerator.ECCLevel.M
                );


            var pngQrCode =
                new PngByteQRCode(qrData);


            /*
             * 8 pixels/module gives a clear QR
             * while keeping the image reasonably compact.
             */
            var qrBytes =
                pngQrCode.GetGraphic(
                    8
                );


            var base64 =
                Convert.ToBase64String(
                    qrBytes
                );


            return Results.Ok(
                new
                {
                    success = true,

                    version = "R1",

                    payload = payload,

                    qrCode =
                        "data:image/png;base64," +
                        base64
                }
            );
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title:
                    "QR Generation Error",

                detail:
                    ex.ToString(),

                statusCode:
                    500
            );
        }
    });
app.MapGet("/api/igqc/grades", (MaterialApi.Services.IGQCGradeService service) =>
{
    try { return Results.Ok(new { success = true, grades = service.GetAll() }); }
    catch (Exception ex) { return Results.Problem(ex.ToString(), statusCode: 500); }
});

app.MapGet("/api/igqc/grades/{testingType}", (string testingType, MaterialApi.Services.IGQCGradeService service) =>
{
    try { return Results.Ok(new { success = true, grades = service.GetByTestingType(testingType) }); }
    catch (Exception ex) { return Results.Problem(ex.ToString(), statusCode: 500); }
});

app.MapPost("/api/igqc/testing/assign",
    (IGQCTestingRequest request, MaterialApi.Services.IGQCTestingService service, MaterialApi.Services.IGQCGradeService grades) =>
    {
        try
        {
            var assignment = service.Save(request, grades);
            return Results.Ok(new { success = true, message = "Testing assignment saved successfully.", assignment });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(ex.ToString(), statusCode: 500);
        }
    });


// =========================================================
// IGQC TESTING - GET ALL RECORDS
// =========================================================

app.MapGet(
    "/api/igqc/testing",
    (MaterialApi.Services.IGQCTestingService service) =>
    {
        try
        {
            var records = service.GetAll();

            return Results.Ok(new
            {
                success = true,
                count = records.Count,
                records
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "IGQC Testing History Error",
                detail: ex.ToString(),
                statusCode: 500);
        }
    });


// =========================================================
// IGQC TESTING - SEARCH
//
// Searches:
// PO / SO / Material ID / GRN / Assignment ID
//
// Example:
// /api/igqc/testing/search?q=PO202608210000000001
// =========================================================

app.MapGet(
    "/api/igqc/testing/search",
    (
        string? q,
        MaterialApi.Services.IGQCTestingService service) =>
    {
        try
        {
            var records = service.Search(q);

            return Results.Ok(new
            {
                success = true,
                count = records.Count,
                search = q ?? "",
                records
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "IGQC Testing Search Error",
                detail: ex.ToString(),
                statusCode: 500);
        }
    });


// =========================================================
// IGQC TESTING - GET BY ASSIGNMENT ID
//
// Example:
// /api/igqc/testing/IGQC-20260828105412532
// =========================================================

app.MapGet(
    "/api/igqc/testing/{assignmentId}",
    (
        string assignmentId,
        MaterialApi.Services.IGQCTestingService service) =>
    {
        try
        {
            if (string.IsNullOrWhiteSpace(assignmentId))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "Assignment ID is required."
                });
            }

            var record =
                service.GetByAssignmentId(assignmentId);

            if (record == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message = "Testing assignment not found."
                });
            }

            return Results.Ok(new
            {
                success = true,
                record
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "IGQC Testing Record Error",
                detail: ex.ToString(),
                statusCode: 500);
        }
    });


// =========================================================
// IGQC TESTING - QR SCAN
//
// QR format:
// R1|PO|SO|ID|MN|GRN
//
// Example:
// R1|PO202608210000000001|SO202608210000000001|
// ID202608210001|Titanium|GRN-000001
// =========================================================

app.MapPost(
    "/api/igqc/testing/scan",
    (
        QRScanRequest request,
        MaterialApi.Services.IGQCTestingService service) =>
    {
        try
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.QrData))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message = "QR data is required."
                });
            }

            var parts = request.QrData.Split(
                '|',
                StringSplitOptions.None);

            if (parts.Length != 6)
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message =
                        "Invalid R1 QR format. Expected: R1|PO|SO|ID|MN|GRN"
                });
            }

            var version = parts[0].Trim();

            if (!string.Equals(
                    version,
                    "R1",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message =
                        $"Unsupported QR version: {version}"
                });
            }

            var po = parts[1].Trim();
            var so = parts[2].Trim();
            var materialId = parts[3].Trim();
            var materialName = parts[4].Trim();
            var grn = parts[5].Trim();

            if (string.IsNullOrWhiteSpace(po) ||
                string.IsNullOrWhiteSpace(so) ||
                string.IsNullOrWhiteSpace(materialId) ||
                string.IsNullOrWhiteSpace(materialName) ||
                string.IsNullOrWhiteSpace(grn))
            {
                return Results.BadRequest(new
                {
                    success = false,
                    message =
                        "QR contains one or more empty fields."
                });
            }

            var records = service.FindByQr(
                po,
                so,
                materialId,
                materialName,
                grn);

            return Results.Ok(new
            {
                success = true,
                version,

                qrData = new
                {
                    po,
                    so,
                    materialId,
                    materialName,
                    grn
                },

                count = records.Count,
                records
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "IGQC Testing QR Scan Error",
                detail: ex.ToString(),
                statusCode: 500);
        }
    });

// =========================================================
// CHEMICAL LAB
// =========================================================

app.MapGet(
    "/api/chemical-lab",
    (ChemicalLabService service) =>
    {
        try
        {
            var records = service.GetAll();

            return Results.Ok(new
            {
                success = true,
                count = records.Count,
                records
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Chemical Lab API Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


// =========================================================
// CHEMICAL LAB - GET BY ASSIGNMENT ID
// =========================================================

app.MapGet(
    "/api/chemical-lab/{assignmentId}",
    (
        string assignmentId,
        ChemicalLabService service) =>
    {
        try
        {
            var record =
                service.GetByAssignmentId(
                    assignmentId);

            if (record == null)
            {
                return Results.NotFound(new
                {
                    success = false,
                    message =
                        "Chemical testing assignment not found."
                });
            }

            return Results.Ok(new
            {
                success = true,
                record
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Chemical Lab API Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });


// =========================================================
// CHEMICAL LAB - ACCEPT
// =========================================================

app.MapPost(
    "/api/chemical-lab/{assignmentId}/accept",
    (
        string assignmentId,
        ChemicalLabService service) =>
    {
        try
        {
            var record =
                service.Accept(
                    assignmentId);

            return Results.Ok(new
            {
                success = true,
                message =
                    "Chemical Lab material accepted successfully.",
                record
            });
        }
        catch (ArgumentException ex)
        {
            return Results.BadRequest(new
            {
                success = false,
                message = ex.Message
            });
        }
        catch (KeyNotFoundException ex)
        {
            return Results.NotFound(new
            {
                success = false,
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                title: "Chemical Lab Accept Error",
                detail: ex.ToString(),
                statusCode: 500
            );
        }
    });



app.Run();