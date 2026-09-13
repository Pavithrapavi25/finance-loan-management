from decimal import Decimal, ROUND_HALF_UP


def calculate_emi(
    principal: Decimal,
    annual_interest_rate: Decimal,
    tenure_months: int
) -> Decimal:
    """
    Calculate monthly EMI using the reducing-balance method.
    """

    principal = Decimal(principal)
    annual_interest_rate = Decimal(annual_interest_rate)

    monthly_rate = (
        annual_interest_rate / Decimal("100")
    ) / Decimal("12")

    if monthly_rate == 0:
        emi = principal / Decimal(tenure_months)
    else:
        factor = (
            (Decimal("1") + monthly_rate)
            ** tenure_months
        )

        emi = (
            principal
            * monthly_rate
            * factor
            / (factor - Decimal("1"))
        )

    return emi.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )