namespace MaterialApi.Models;

public class InboundGoods
{
    public string ReceiptId { get; set; } = "";

    public string PoNumber { get; set; } = "";

    public string VendorCode { get; set; } = "";

    public string VendorName { get; set; } = "";

    public string MaterialIdentifier { get; set; } = "";

    public string MaterialName { get; set; } = "";

    public string UnitOfMeasure { get; set; } = "";

    public decimal Quantity { get; set; }

    public string BatchLotNumber { get; set; } = "";

    public string SupplierInvoice { get; set; } = "";

    public DateTime ReceiptDate { get; set; }

    public string Remarks { get; set; } = "";
}