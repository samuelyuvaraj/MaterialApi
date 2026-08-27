using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

public class ConsumptionService
{
    private readonly string _dataFolder;
    private readonly string _excelPath;

    public ConsumptionService()
    {
        _dataFolder = Path.Combine(
            AppContext.BaseDirectory,
            "Data"
        );

        _excelPath = Path.Combine(
            _dataFolder,
            "Consumption.xlsx"
        );

        EnsureExcelFile();
    }



    // =====================================================
    // GET ALL
    // =====================================================

    public List<Consumption> GetAll()
    {
        EnsureExcelFile();

        using var workbook = new XLWorkbook(_excelPath);

        var worksheet = workbook.Worksheet(1);

        var records = new List<Consumption>();

        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            if (string.IsNullOrWhiteSpace(
                row.Cell(1).GetString()))
            {
                continue;
            }

            records.Add(ReadRow(row));
        }

        return records;
    }


    // =====================================================
    // GET BY GRN
    // =====================================================

    public Consumption? GetByReceiptId(
        string receiptId)
    {
        if (string.IsNullOrWhiteSpace(receiptId))
        {
            return null;
        }

        return GetAll()
            .FirstOrDefault(x =>
                string.Equals(
                    x.ReceiptId?.Trim(),
                    receiptId.Trim(),
                    StringComparison.OrdinalIgnoreCase));
    }


    // =====================================================
    // FIND BY QR DATA
    // PO + SO + MATERIAL ID + GRN
    // =====================================================

    public Consumption? FindByQrData(
        string poNumber,
        string soNumber,
        string materialIdentifier,
        string receiptId)
    {
        if (string.IsNullOrWhiteSpace(poNumber) ||
            string.IsNullOrWhiteSpace(soNumber) ||
            string.IsNullOrWhiteSpace(materialIdentifier) ||
            string.IsNullOrWhiteSpace(receiptId))
        {
            return null;
        }

        var po = poNumber.Trim();
        var so = soNumber.Trim();
        var materialId = materialIdentifier.Trim();
        var grn = receiptId.Trim();

        return GetAll()
            .FirstOrDefault(x =>
                string.Equals(
                    x.PoNumber?.Trim(),
                    po,
                    StringComparison.OrdinalIgnoreCase)

                &&

                string.Equals(
                    x.SoNumber?.Trim(),
                    so,
                    StringComparison.OrdinalIgnoreCase)

                &&

                string.Equals(
                    x.MaterialIdentifier?.Trim(),
                    materialId,
                    StringComparison.OrdinalIgnoreCase)

                &&

                string.Equals(
                    x.ReceiptId?.Trim(),
                    grn,
                    StringComparison.OrdinalIgnoreCase));
    }


    // =====================================================
    // CONSUME QUANTITY
    // =====================================================

    public Consumption Consume(
        string poNumber,
        string soNumber,
        string materialIdentifier,
        string receiptId,
        decimal quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentException(
                "Consumption quantity must be greater than zero.");
        }

        EnsureExcelFile();

        using var workbook = new XLWorkbook(_excelPath);

        var worksheet = workbook.Worksheet(1);

        foreach (var row in worksheet.RowsUsed().Skip(1))
        {
            if (string.IsNullOrWhiteSpace(
                row.Cell(1).GetString()))
            {
                continue;
            }

            var record = ReadRow(row);

            var match =
                string.Equals(
                    record.PoNumber?.Trim(),
                    poNumber?.Trim(),
                    StringComparison.OrdinalIgnoreCase)

                &&

                string.Equals(
                    record.SoNumber?.Trim(),
                    soNumber?.Trim(),
                    StringComparison.OrdinalIgnoreCase)

                &&

                string.Equals(
                    record.MaterialIdentifier?.Trim(),
                    materialIdentifier?.Trim(),
                    StringComparison.OrdinalIgnoreCase)

                &&

                string.Equals(
                    record.ReceiptId?.Trim(),
                    receiptId?.Trim(),
                    StringComparison.OrdinalIgnoreCase);

            if (!match)
            {
                continue;
            }

            // ---------------------------------------------
            // Validate available quantity
            // ---------------------------------------------

            if (quantity > record.AvailableQuantity)
            {
                throw new InvalidOperationException(
                    $"Insufficient available quantity. " +
                    $"Available: {record.AvailableQuantity}, " +
                    $"Requested: {quantity}.");
            }

            // ---------------------------------------------
            // Calculate new quantities
            // ---------------------------------------------

            var newConsumed =
                record.ConsumedQuantity + quantity;

            var newAvailable =
                record.ReceivedQuantity - newConsumed;

            if (newAvailable < 0)
            {
                throw new InvalidOperationException(
                    "Consumption quantity cannot exceed received quantity.");
            }

            // ---------------------------------------------
            // Calculate status
            // ---------------------------------------------

            string newStatus;

            if (newAvailable == 0)
            {
                newStatus = "Consumed";
            }
            else if (newConsumed > 0)
            {
                newStatus = "Partially Consumed";
            }
            else
            {
                newStatus = "Available";
            }

            var now = DateTime.Now;

            // ---------------------------------------------
            // Update Excel
            //
            // A = PO
            // B = SO
            // C = Material Identifier
            // D = Material Name
            // E = GRN
            // F = UOM
            // G = Received
            // H = Available
            // I = Consumed
            // J = Status
            // K = Last Updated
            // ---------------------------------------------

            worksheet.Cell(row.RowNumber(), 8).Value =
                newAvailable;

            worksheet.Cell(row.RowNumber(), 9).Value =
                newConsumed;

            worksheet.Cell(row.RowNumber(), 10).Value =
                newStatus;

            worksheet.Cell(row.RowNumber(), 11).Value =
                now;

            worksheet.Cell(row.RowNumber(), 11)
                .Style.DateFormat.Format =
                "dd-MMM-yyyy HH:mm:ss";

            workbook.Save();

            // ---------------------------------------------
            // Return updated object
            // ---------------------------------------------

            record.AvailableQuantity =
                newAvailable;

            record.ConsumedQuantity =
                newConsumed;

            record.Status =
                newStatus;

            record.LastUpdated =
                now;

            return record;
        }

        throw new KeyNotFoundException(
            "Consumption record not found.");
    }


    // =====================================================
    // CREATE INITIAL RECORD
    // =====================================================

    public Consumption Create(
        Consumption consumption)
    {
        if (consumption == null)
        {
            throw new ArgumentNullException(
                nameof(consumption));
        }

        EnsureExcelFile();

        if (consumption.ReceivedQuantity <= 0)
        {
            throw new ArgumentException(
                "Received quantity must be greater than zero.");
        }

        using var workbook =
            new XLWorkbook(_excelPath);

        var worksheet =
            workbook.Worksheet(1);

        var nextRow =
            (worksheet.LastRowUsed()?.RowNumber() ?? 1) + 1;

        var now = DateTime.Now;

        // ---------------------------------------------
        // Initial quantity state
        // ---------------------------------------------

        consumption.ConsumedQuantity = 0;

        consumption.AvailableQuantity =
            consumption.ReceivedQuantity;

        consumption.Status =
            "Available";

        consumption.LastUpdated =
            now;

        // ---------------------------------------------
        // Excel columns
        // ---------------------------------------------

        worksheet.Cell(nextRow, 1).Value =
            consumption.PoNumber;

        worksheet.Cell(nextRow, 2).Value =
            consumption.SoNumber;

        worksheet.Cell(nextRow, 3).Value =
            consumption.MaterialIdentifier;

        worksheet.Cell(nextRow, 4).Value =
            consumption.MaterialName;

        worksheet.Cell(nextRow, 5).Value =
            consumption.ReceiptId;

        worksheet.Cell(nextRow, 6).Value =
            consumption.UnitOfMeasure;

        worksheet.Cell(nextRow, 7).Value =
            consumption.ReceivedQuantity;

        worksheet.Cell(nextRow, 8).Value =
            consumption.AvailableQuantity;

        worksheet.Cell(nextRow, 9).Value =
            consumption.ConsumedQuantity;

        worksheet.Cell(nextRow, 10).Value =
            consumption.Status;

        worksheet.Cell(nextRow, 11).Value =
            consumption.LastUpdated;

        worksheet.Cell(nextRow, 11)
            .Style.DateFormat.Format =
            "dd-MMM-yyyy HH:mm:ss";

        // ---------------------------------------------
        // Material Name can be 350+ characters
        // ---------------------------------------------

        worksheet.Column(4).Width = 60;

        worksheet.Columns()
            .AdjustToContents();

        // Re-apply material width because
        // AdjustToContents can make it excessively wide.
        worksheet.Column(4).Width = 60;

        workbook.Save();

        return consumption;
    }


    // =====================================================
    // READ EXCEL ROW
    // =====================================================

    private static Consumption ReadRow(
        IXLRow row)
    {
        return new Consumption
        {
            PoNumber =
                row.Cell(1)
                    .GetString()
                    .Trim(),

            SoNumber =
                row.Cell(2)
                    .GetString()
                    .Trim(),

            MaterialIdentifier =
                row.Cell(3)
                    .GetString()
                    .Trim(),

            MaterialName =
                row.Cell(4)
                    .GetString(),

            ReceiptId =
                row.Cell(5)
                    .GetString()
                    .Trim(),

            UnitOfMeasure =
                row.Cell(6)
                    .GetString()
                    .Trim(),

            ReceivedQuantity =
                GetDecimalValue(
                    row.Cell(7)),

            AvailableQuantity =
                GetDecimalValue(
                    row.Cell(8)),

            ConsumedQuantity =
                GetDecimalValue(
                    row.Cell(9)),

            Status =
                row.Cell(10)
                    .GetString()
                    .Trim(),

            LastUpdated =
                GetDateValue(
                    row.Cell(11))
        };
    }


    // =====================================================
    // DECIMAL
    // =====================================================

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


    // =====================================================
    // DATE
    // =====================================================

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


    // =====================================================
    // CREATE EXCEL FILE
    // =====================================================

    private void EnsureExcelFile()
    {
        Directory.CreateDirectory(
            _dataFolder);

        if (File.Exists(_excelPath))
        {
            return;
        }

        using var workbook =
            new XLWorkbook();

        var worksheet =
            workbook.Worksheets.Add(
                "Consumption");

        // ---------------------------------------------
        // EXACT COLUMN STRUCTURE
        // ---------------------------------------------

        worksheet.Cell(1, 1).Value =
            "PO";

        worksheet.Cell(1, 2).Value =
            "SO";

        worksheet.Cell(1, 3).Value =
            "Material Identifier";

        worksheet.Cell(1, 4).Value =
            "Material Name";

        worksheet.Cell(1, 5).Value =
            "GRN";

        worksheet.Cell(1, 6).Value =
            "UOM";

        worksheet.Cell(1, 7).Value =
            "Received";

        worksheet.Cell(1, 8).Value =
            "Available";

        worksheet.Cell(1, 9).Value =
            "Consumed";

        worksheet.Cell(1, 10).Value =
            "Status";

        worksheet.Cell(1, 11).Value =
            "Last Updated";

        // ---------------------------------------------
        // Header style
        // ---------------------------------------------

        var headerRange =
            worksheet.Range("A1:K1");

        headerRange.Style.Font.Bold = true;

        headerRange.Style.Fill.BackgroundColor =
            XLColor.LightGray;

        // ---------------------------------------------
        // Column sizing
        // ---------------------------------------------

        worksheet.Column(1).Width = 25;
        worksheet.Column(2).Width = 25;
        worksheet.Column(3).Width = 25;

        // Material name can be 350+ characters.
        // Keep Excel usable instead of making the
        // entire worksheet hundreds of characters wide.
        worksheet.Column(4).Width = 60;

        worksheet.Column(5).Width = 18;
        worksheet.Column(6).Width = 12;
        worksheet.Column(7).Width = 15;
        worksheet.Column(8).Width = 15;
        worksheet.Column(9).Width = 15;
        worksheet.Column(10).Width = 20;
        worksheet.Column(11).Width = 22;

        worksheet.Column(11)
            .Style.DateFormat.Format =
            "dd-MMM-yyyy HH:mm:ss";

        workbook.SaveAs(
            _excelPath);
    }


}