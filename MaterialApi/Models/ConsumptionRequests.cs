namespace MaterialApi.Models;

public record QRScanRequest(
    string QrData
);

public record ConsumptionConfirmRequest(
    string Po,
    string So,
    string Id,
    string Grn
);

public record ConsumptionRequest(
    string Po,
    string So,
    string Id,
    string Grn,
    decimal Quantity
);