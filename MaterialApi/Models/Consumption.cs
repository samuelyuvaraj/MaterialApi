namespace MaterialApi.Models;

public class Consumption
{
    public string PoNumber { get; set; } = "";

    public string SoNumber { get; set; } = "";

    public string MaterialIdentifier { get; set; } = "";

    // Supports 350+ character material names
    public string MaterialName { get; set; } = "";

    public string ReceiptId { get; set; } = "";

    public string UnitOfMeasure { get; set; } = "";

    public decimal ReceivedQuantity { get; set; }

    public decimal AvailableQuantity { get; set; }

    public decimal ConsumedQuantity { get; set; }

    public string Vendor { get; set; } = "";

    public string Status { get; set; } = "Available";

    public DateTime LastUpdated { get; set; }
}