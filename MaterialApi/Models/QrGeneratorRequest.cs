namespace MaterialApi.Models;

public record QrGeneratorRequest(
    string Po,
    string So,
    string Id,
    string Mn,
    string Grn
);