const convertToIndianWords = (number) => {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "Ten",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertLessThanThousand = (num) => {
    if (num === 0) return "";
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 !== 0 ? " " + units[num % 10] : "")
      );
    }
    return (
      units[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 !== 0 ? " " + convertLessThanThousand(num % 100) : "")
    );
  };

  const convert = (num) => {
    if (num === 0) return "Zero";
    let result = "";

    // Crores
    if (Math.floor(num / 10000000) > 0) {
      result += convertLessThanThousand(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }

    // Lakhs
    if (Math.floor(num / 100000) > 0) {
      result += convertLessThanThousand(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }

    // Thousands
    if (Math.floor(num / 1000) > 0) {
      result += convertLessThanThousand(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }

    // Hundreds, Tens and Units
    if (num > 0) {
      result += convertLessThanThousand(num);
    }

    return result.trim().replace(/\s+/g, " ");
  };

  return convert(number);
};

export const convertAmountToIndianWords = (amount) => {
  try {
    // Split into rupees and paise
    const parts = amount.toString().split(".");
    let rupees = parts[0];
    let paise = parts.length > 1 ? parts[1].substring(0, 2) : "00";

    // Pad paise with zero if needed
    if (paise.length === 1) paise += "0";

    // Convert rupees part
    let words = "Rs " + convertToIndianWords(parseInt(rupees));

    // Add paise if not zero
    if (paise !== "00") {
      words += " and " + convertToIndianWords(parseInt(paise)) + " Paise";
    }

    return words + " Only";
  } catch (error) {
    console.error("Error converting amount to words:", error);
    return "Rs Zero Only";
  }
};
