from app.schemas import DestinationCountry


def get_country_rule_notes(country: DestinationCountry) -> dict:
    notes = {
        "france": {
            "name": "France",
            "rule_module": "france_2026",
            "status": "country_specific_rules_pending_validation",
        },
        "italy": {
            "name": "Italy",
            "rule_module": "italy_2026",
            "status": "country_specific_rules_pending_validation",
        },
        "portugal": {
            "name": "Portugal",
            "rule_module": "portugal_2026",
            "status": "country_specific_rules_pending_validation",
        },
    }
    return notes[country]

