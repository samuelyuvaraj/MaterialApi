using ClosedXML.Excel;
using MaterialApi.Models;

namespace MaterialApi.Services;

public class MechanicalLabService
{
    private readonly string _igqcExcelPath;
    private readonly string _mechanicalLabExcelPath;

    private static readonly object FileLock = new();

    public MechanicalLabService()
    {
        _igqcExcelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "IGQC_Data.xlsx"
        );

        _mechanicalLabExcelPath = Path.Combine(
            AppContext.BaseDirectory,
            "Data",
            "Mechanical_Lab_Data.xlsm"
        );
    }

    // =========================================================
    // GET ALL MECHANICAL LAB RECORDS
    // =========================================================

    public List<MechanicalLabRecord> GetAll()
    {
        var result = new List<MechanicalLabRecord>();

        if (!File.Exists(_igqcExcelPath))
            return result;

        using var workbook =
            new XLWorkbook(_igqcExcelPath);

        var ws =
            workbook.Worksheets.FirstOrDefault();

        if (ws == null)
            return result;

        var lastRow =
            ws.LastRowUsed()?.RowNumber() ?? 1;

        for (int row = 2; row <= lastRow; row++)
        {
            // Column 11 = Mechanical Testing
            var mechanicalTesting =
                ws.Cell(row, 11)
                  .GetString()
                  .Trim();

            if (!string.Equals(
                    mechanicalTesting,
                    "Yes",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var record =
                ReadMechanicalRecord(ws, row);

            var savedRecord =
                GetSavedRecord(record.AssignmentId);

            if (savedRecord != null)
            {
                result.Add(savedRecord);
            }
            else
            {
                result.Add(record);
            }
        }

        return result;
    }


    // =========================================================
    // GET BY ASSIGNMENT ID
    // =========================================================

    public MechanicalLabRecord? GetByAssignmentId(
        string assignmentId)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
            return null;

        return GetAll()
            .FirstOrDefault(x =>
                string.Equals(
                    x.AssignmentId.Trim(),
                    assignmentId.Trim(),
                    StringComparison.OrdinalIgnoreCase));
    }


    // =========================================================
    // ACCEPT MECHANICAL LAB RECORD
    // =========================================================

    // =========================================================
    // ACCEPT MECHANICAL LAB RECORD
    //
    // Updates BOTH:
    //
    // 1. Mechanical_Lab_Data.xlsm
    //    Mechanical Status
    //    Accepted Date
    //    Accepted Time
    //
    // 2. IGQC_Data.xlsx
    //    Mechanical Status = Accepted
    //    Column 26
    // =========================================================

    public MechanicalLabRecord Accept(string assignmentId)
    {
        if (string.IsNullOrWhiteSpace(assignmentId))
            throw new ArgumentException("Assignment ID is required.");

        lock (FileLock)
        {
            // =====================================================
            // 1. FIND ASSIGNMENT FROM IGQC_Data.xlsx
            // =====================================================

            if (!File.Exists(_igqcExcelPath))
                throw new FileNotFoundException(
                    "IGQC_Data.xlsx was not found.",
                    _igqcExcelPath);

            MechanicalLabRecord record;

            using (var igqcWorkbook = new XLWorkbook(_igqcExcelPath))
            {
                var ws = igqcWorkbook.Worksheets.FirstOrDefault();

                if (ws == null)
                    throw new InvalidOperationException(
                        "IGQC_Data.xlsx worksheet was not found.");

                var rowNumber = FindAssignmentRow(
                    ws,
                    assignmentId);

                if (rowNumber == 0)
                    throw new KeyNotFoundException(
                        $"Assignment '{assignmentId}' was not found in IGQC_Data.xlsx.");

                // Read mechanical data directly from IGQC
                record = ReadMechanicalRecord(
                    ws,
                    rowNumber);

                // =================================================
                // ALREADY ACCEPTED
                // =================================================

                if (string.Equals(
                        record.MechanicalStatus,
                        "Accepted",
                        StringComparison.OrdinalIgnoreCase))
                {
                    // Get accepted information from Mechanical Excel
                    var saved = GetSavedRecord(assignmentId);

                    return saved ?? record;
                }

                // =================================================
                // ACCEPT NOW
                // =================================================

                var now = DateTime.Now;

                record.MechanicalStatus = "Accepted";
                record.AcceptedDate = now.ToString("yyyy-MM-dd");
                record.AcceptedTime = now.ToString("HH:mm:ss");

                // -------------------------------------------------
                // IMPORTANT:
                // IGQC_Data.xlsx
                //
                // Mechanical Status = column 26
                // -------------------------------------------------

                ws.Cell(rowNumber, 26).Value = "Accepted";

                igqcWorkbook.SaveAs(_igqcExcelPath);
            }


            // =====================================================
            // 2. SAVE / UPDATE Mechanical_Lab_Data.xlsm
            // =====================================================

            Directory.CreateDirectory(
                Path.GetDirectoryName(_mechanicalLabExcelPath)!);

            using (var mechanicalWorkbook =
                   File.Exists(_mechanicalLabExcelPath)
                       ? new XLWorkbook(_mechanicalLabExcelPath)
                       : new XLWorkbook())
            {
                var mechanicalWs =
                    mechanicalWorkbook.Worksheets
                        .FirstOrDefault(x => x.Name == "Mechanical")
                    ?? mechanicalWorkbook.Worksheets.Add("Mechanical");

                EnsureHeaders(mechanicalWs);

                var mechanicalRow =
                    FindAssignmentRow(
                        mechanicalWs,
                        assignmentId);

                if (mechanicalRow == 0)
                {
                    mechanicalRow =
                        (mechanicalWs.LastRowUsed()?.RowNumber() ?? 1) + 1;
                }

                Write(
                    mechanicalWs,
                    mechanicalRow,
                    record);

                mechanicalWorkbook.SaveAs(
                    _mechanicalLabExcelPath);
            }


            // =====================================================
            // 3. RETURN UPDATED RECORD
            // =====================================================

            return record;
        }
    }


    // =========================================================
    // READ IGQC DATA
    //
    // IGQC_Data.xlsx
    //
    // 1  Assignment ID
    // 2  Date
    // 3  Time
    // 4  PO
    // 5  SO
    // 6  Material ID
    // 7  GRN
    // 8  Material Name
    // 9  Unit
    // 10 Chemical Testing
    // 11 Mechanical Testing
    // 12 Dimensional Testing
    // 13 Chemical Grade
    // 14 Mechanical Grade
    // 15 Dimensional Grade
    // 16 Chemical Quantity
    // 17 Mechanical Quantity
    // 18 Dimensional Quantity
    // 19 Chemical Equipment
    // 20 Mechanical Equipment
    // 21 Dimensional Equipment
    // 22 Chemical Sample Consumed
    // 23 Mechanical Sample Consumed
    // 24 Dimensional Sample Consumed
    // 25 Chemical Status
    // 26 Mechanical Status
    // 27 Dimensional Status
    // 28 Vendor
    // =========================================================

    private static MechanicalLabRecord ReadMechanicalRecord(
        IXLWorksheet ws,
        int row)
    {
        return new MechanicalLabRecord
        {
            AssignmentId =
                Cell(ws, row, 1),

            Date =
                Cell(ws, row, 2),

            Time =
                Cell(ws, row, 3),

            Po =
                Cell(ws, row, 4),

            So =
                Cell(ws, row, 5),

            MaterialId =
                Cell(ws, row, 6),

            Grn =
                Cell(ws, row, 7),

            MaterialName =
                Cell(ws, row, 8),

            Unit =
                Cell(ws, row, 9),

            // Vendor = IGQC column 28
            Vendor =
                Cell(ws, row, 28),

            // Mechanical = IGQC column 14
            MechanicalGrade =
                Cell(ws, row, 14),

            // Mechanical Quantity = IGQC column 17
            MechanicalQuantity =
                DecimalCell(ws, row, 17),

            // Mechanical Equipment = IGQC column 20
            MechanicalEquipment =
                Cell(ws, row, 20),

            // Mechanical Sample Consumed = IGQC column 23
            MechanicalSampleConsumed =
                Cell(ws, row, 23),

            // Mechanical Status = IGQC column 26
            MechanicalStatus =
                Cell(ws, row, 26)
        };
    }


    // =========================================================
    // READ SAVED MECHANICAL RECORD
    //
    // Mechanical_Lab_Data.xlsm
    // Sheet: Mechanical
    //
    // 1  Assignment ID
    // 2  Date
    // 3  Time
    // 4  PO
    // 5  SO
    // 6  Material ID
    // 7  GRN
    // 8  Material Name
    // 9  Unit
    // 10 Vendor
    // 11 Mechanical Grade
    // 12 Mechanical Quantity
    // 13 Mechanical Equipment
    // 14 Mechanical Sample Consumed
    // 15 Mechanical Status
    // 16 Accepted Date
    // 17 Accepted Time
    // =========================================================

    private MechanicalLabRecord? GetSavedRecord(
        string assignmentId)
    {
        if (!File.Exists(
                _mechanicalLabExcelPath))
        {
            return null;
        }

        using var workbook =
            new XLWorkbook(
                _mechanicalLabExcelPath);

        var ws =
            workbook.Worksheets
                .FirstOrDefault(
                    x => x.Name == "Mechanical");

        if (ws == null)
            return null;

        var lastRow =
            ws.LastRowUsed()?.RowNumber()
            ?? 1;

        for (
            int row = 2;
            row <= lastRow;
            row++)
        {
            var id =
                Cell(ws, row, 1);

            if (!string.Equals(
                    id,
                    assignmentId,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            return new MechanicalLabRecord
            {
                AssignmentId =
                    Cell(ws, row, 1),

                Date =
                    Cell(ws, row, 2),

                Time =
                    Cell(ws, row, 3),

                Po =
                    Cell(ws, row, 4),

                So =
                    Cell(ws, row, 5),

                MaterialId =
                    Cell(ws, row, 6),

                Grn =
                    Cell(ws, row, 7),

                MaterialName =
                    Cell(ws, row, 8),

                Unit =
                    Cell(ws, row, 9),

                Vendor =
                    Cell(ws, row, 10),

                MechanicalGrade =
                    Cell(ws, row, 11),

                MechanicalQuantity =
                    DecimalCell(ws, row, 12),

                MechanicalEquipment =
                    Cell(ws, row, 13),

                MechanicalSampleConsumed =
                    Cell(ws, row, 14),

                MechanicalStatus =
                    Cell(ws, row, 15),

                AcceptedDate =
                    Cell(ws, row, 16),

                AcceptedTime =
                    Cell(ws, row, 17)
            };
        }

        return null;
    }


    // =========================================================
    // EXCEL HEADERS
    // =========================================================

    private static void EnsureHeaders(
        IXLWorksheet ws)
    {
        string[] headers =
        {
            "Assignment ID",
            "Date",
            "Time",
            "PO",
            "SO",
            "Material ID",
            "GRN",
            "Material Name",
            "Unit",
            "Vendor",
            "Mechanical Grade",
            "Mechanical Quantity",
            "Mechanical Equipment",
            "Mechanical Sample Consumed",
            "Mechanical Status",
            "Accepted Date",
            "Accepted Time"
        };

        for (
            int i = 0;
            i < headers.Length;
            i++)
        {
            ws.Cell(1, i + 1).Value =
                headers[i];
        }
    }


    // =========================================================
    // WRITE
    // =========================================================

    private static void Write(
        IXLWorksheet ws,
        int row,
        MechanicalLabRecord record)
    {
        var values =
            new object?[]
            {
                record.AssignmentId,
                record.Date,
                record.Time,
                record.Po,
                record.So,
                record.MaterialId,
                record.Grn,
                record.MaterialName,
                record.Unit,
                record.Vendor,
                record.MechanicalGrade,
                record.MechanicalQuantity,
                record.MechanicalEquipment,
                record.MechanicalSampleConsumed,
                record.MechanicalStatus,
                record.AcceptedDate,
                record.AcceptedTime
            };

        for (
            int i = 0;
            i < values.Length;
            i++)
        {
            ws.Cell(
                row,
                i + 1)
              .Value =
                values[i]?.ToString() ?? "";
        }
    }


    // =========================================================
    // FIND ASSIGNMENT
    // =========================================================

    private static int FindAssignmentRow(
        IXLWorksheet ws,
        string assignmentId)
    {
        var lastRow =
            ws.LastRowUsed()?.RowNumber()
            ?? 1;

        for (
            int row = 2;
            row <= lastRow;
            row++)
        {
            if (string.Equals(
                    Cell(ws, row, 1),
                    assignmentId,
                    StringComparison.OrdinalIgnoreCase))
            {
                return row;
            }
        }

        return 0;
    }


    // =========================================================
    // STRING CELL
    // =========================================================

    private static string Cell(
        IXLWorksheet ws,
        int row,
        int column)
    {
        return ws.Cell(
                row,
                column)
            .GetString()
            .Trim();
    }


    // =========================================================
    // DECIMAL CELL
    // =========================================================

    private static decimal? DecimalCell(
        IXLWorksheet ws,
        int row,
        int column)
    {
        var value =
            ws.Cell(
                    row,
                    column)
              .GetString()
              .Trim();

        if (decimal.TryParse(
                value,
                out var result))
        {
            return result;
        }

        return null;
    }
}