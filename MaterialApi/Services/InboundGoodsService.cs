using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

public class InboundGoodsService
{
    private readonly string _dataFolder;
    private readonly string _excelPath;

    public InboundGoodsService()
    {
        _dataFolder = Path.Combine(
            AppContext.BaseDirectory,
            "Data"
        );

        _excelPath = Path.Combine(
            _dataFolder,
            "InboundGoods.xlsx"
        );

        EnsureExcelFile();
    }

    public List<InboundGoods> GetAllInbound()
    {
        if (!File.Exists(_excelPath))
        {
            EnsureExcelFile();
        }

        using var workbook =
            new XLWorkbook(_excelPath);

        var worksheet =
            workbook.Worksheet(1);

        var records =
            new List<InboundGoods>();

        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            var receiptId =
                row.Cell(1).GetString().Trim();

            if (string.IsNullOrWhiteSpace(receiptId))
            {
                continue;
            }

            records.Add(new InboundGoods
            {
                ReceiptId =
                    receiptId,

                PoNumber =
                    row.Cell(2).GetString().Trim(),

                VendorCode =
                    row.Cell(3).GetString().Trim(),

                VendorName =
                    row.Cell(4).GetString().Trim(),

                MaterialIdentifier =
                    row.Cell(5).GetString().Trim(),

                MaterialName =
                    row.Cell(6).GetString().Trim(),

                UnitOfMeasure =
                    row.Cell(7).GetString().Trim(),

                Quantity =
                    GetDecimalValue(row.Cell(8)),

                BatchLotNumber =
                    row.Cell(9).GetString().Trim(),

                SupplierInvoice =
                    row.Cell(10).GetString().Trim(),

                ReceiptDate =
                    GetDateValue(row.Cell(11)),

                Remarks =
                    row.Cell(12).GetString().Trim()
            });
        }

        return records;
    }


    public InboundGoods? GetInboundByReceiptId(
        string receiptId)
    {
        var records =
            GetAllInbound();

        return records.FirstOrDefault(
            x => string.Equals(
                x.ReceiptId,
                receiptId,
                StringComparison.OrdinalIgnoreCase
            )
        );
    }


    private static decimal GetDecimalValue(
        IXLCell cell)
    {
        if (cell.IsEmpty())
        {
            return 0;
        }

        if (cell.TryGetValue<decimal>(
            out var value))
        {
            return value;
        }

        return decimal.TryParse(
            cell.GetString().Trim(),
            out var parsed)
            ? parsed
            : 0;
    }


    private static DateTime GetDateValue(
        IXLCell cell)
    {
        if (cell.TryGetValue<DateTime>(
            out var value))
        {
            return value;
        }

        return DateTime.TryParse(
            cell.GetString().Trim(),
            out var parsed)
            ? parsed
            : DateTime.MinValue;
    }


    private void EnsureExcelFile()
    {
        Directory.CreateDirectory(_dataFolder);

        if (File.Exists(_excelPath))
        {
            return;
        }

        using var workbook =
            new XLWorkbook();

        var worksheet =
            workbook.Worksheets.Add(
                "Inbound Goods"
            );

        worksheet.Cell(1, 1).Value =
            "Receipt ID";

        worksheet.Cell(1, 2).Value =
            "PO Number";

        worksheet.Cell(1, 3).Value =
            "Vendor Code";

        worksheet.Cell(1, 4).Value =
            "Vendor Name";

        worksheet.Cell(1, 5).Value =
            "Material Identifier";

        worksheet.Cell(1, 6).Value =
            "Material Name";

        worksheet.Cell(1, 7).Value =
            "Unit Of Measure";

        worksheet.Cell(1, 8).Value =
            "Quantity";

        worksheet.Cell(1, 9).Value =
            "Batch / Lot Number";

        worksheet.Cell(1, 10).Value =
            "Supplier Invoice";

        worksheet.Cell(1, 11).Value =
            "Receipt Date";

        worksheet.Cell(1, 12).Value =
            "Remarks";

        var headerRange =
            worksheet.Range("A1:L1");

        headerRange.Style.Font.Bold = true;

        headerRange.Style.Fill.BackgroundColor =
            XLColor.LightGray;

        SetColumnWidths(worksheet);

        workbook.SaveAs(_excelPath);
    }


    public string GenerateReceiptId()
    {
        if (!File.Exists(_excelPath))
        {
            EnsureExcelFile();
        }

        using var workbook =
            new XLWorkbook(_excelPath);

        var worksheet =
            workbook.Worksheet(1);

        int maxNumber = 0;

        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            var receiptId =
                row.Cell(1)
                    .GetString()
                    .Trim();

            if (string.IsNullOrWhiteSpace(receiptId))
            {
                continue;
            }

            if (!receiptId.StartsWith(
                    "GRN-",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var numberPart =
                receiptId.Substring(4);

            if (int.TryParse(
                    numberPart,
                    out var number))
            {
                if (number > maxNumber)
                {
                    maxNumber = number;
                }
            }
        }

        return $"GRN-{maxNumber + 1:000000}";
    }


    public InboundGoods SaveInbound(
        InboundGoods inbound)
    {
        if (!File.Exists(_excelPath))
        {
            EnsureExcelFile();
        }

        // Generate GRN inside the save operation
        inbound.ReceiptId =
            GenerateReceiptId();

        // Set receipt date automatically
        if (inbound.ReceiptDate ==
            DateTime.MinValue)
        {
            inbound.ReceiptDate =
                DateTime.Now;
        }

        using var workbook =
            new XLWorkbook(_excelPath);

        var worksheet =
            workbook.Worksheet(1);

        var nextRow =
            (worksheet.LastRowUsed()
                ?.RowNumber() ?? 1) + 1;


        worksheet.Cell(nextRow, 1).Value =
            inbound.ReceiptId;

        worksheet.Cell(nextRow, 2).Value =
            inbound.PoNumber;

        worksheet.Cell(nextRow, 3).Value =
            inbound.VendorCode;

        worksheet.Cell(nextRow, 4).Value =
            inbound.VendorName;

        worksheet.Cell(nextRow, 5).Value =
            inbound.MaterialIdentifier;

        worksheet.Cell(nextRow, 6).Value =
            inbound.MaterialName;

        worksheet.Cell(nextRow, 7).Value =
            inbound.UnitOfMeasure;

        worksheet.Cell(nextRow, 8).Value =
            inbound.Quantity;

        worksheet.Cell(nextRow, 9).Value =
            inbound.BatchLotNumber;

        worksheet.Cell(nextRow, 10).Value =
            inbound.SupplierInvoice;

        worksheet.Cell(nextRow, 11).Value =
            inbound.ReceiptDate;

        worksheet.Cell(nextRow, 11)
            .Style.DateFormat.Format =
            "dd-MMM-yyyy HH:mm:ss";

        worksheet.Cell(nextRow, 12).Value =
            inbound.Remarks;


        SetColumnWidths(worksheet);

        workbook.Save();

        return inbound;
    }


    private static void SetColumnWidths(
        IXLWorksheet worksheet)
    {
        worksheet.Column(1).Width = 16;
        worksheet.Column(2).Width = 18;
        worksheet.Column(3).Width = 14;
        worksheet.Column(4).Width = 28;
        worksheet.Column(5).Width = 20;
        worksheet.Column(6).Width = 24;
        worksheet.Column(7).Width = 18;
        worksheet.Column(8).Width = 12;
        worksheet.Column(9).Width = 20;
        worksheet.Column(10).Width = 20;
        worksheet.Column(11).Width = 24;
        worksheet.Column(12).Width = 28;
    }
}