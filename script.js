let salary = 0;
let expenses = [];
let chart;

let currentCurrency = "INR";
let exchangeRate = 1;

const currencySymbols = {
  INR: "₹",
  USD: "$",
  EUR: "€"
};

const salaryInput = document.getElementById("salaryInput");
const salaryBtn = document.getElementById("salaryBtn");

const expenseName = document.getElementById("expenseName");
const expenseAmount = document.getElementById("expenseAmount");
const expenseBtn = document.getElementById("expenseBtn");

const totalSalary = document.getElementById("totalSalary");
const totalExpenses = document.getElementById("totalExpenses");
const remainingBalance = document.getElementById("remainingBalance");

const expenseList = document.getElementById("expenseList");

const alertBox = document.getElementById("alertBox");
const balanceText = document.getElementById("balanceText");

const currencySelect = document.getElementById("currencySelect");

const salaryCurrency = document.getElementById("salaryCurrency");
const salaryCurrency2 = document.getElementById("salaryCurrency2");
const salaryCurrency3 = document.getElementById("salaryCurrency3");

// Load LocalStorage
window.onload = function () {

  const savedSalary = localStorage.getItem("salary");
  const savedExpenses = localStorage.getItem("expenses");

  if (savedSalary) {
    salary = Number(savedSalary);
  }

  if (savedExpenses) {
    expenses = JSON.parse(savedExpenses);
  }

  updateUI();
};

// Currency Change
currencySelect.addEventListener("change", async () => {

  currentCurrency = currencySelect.value;

  if (currentCurrency === "INR") {
    exchangeRate = 1;
    updateUI();
    return;
  }

  try {

    const response = await fetch(
      `https://api.frankfurter.app/latest?from=INR&to=${currentCurrency}`
    );

    const data = await response.json();

    exchangeRate = data.rates[currentCurrency];

    updateUI();

  } catch (error) {

    alert("Currency API failed");

    console.log(error);
  }
});

// Save Salary
salaryBtn.addEventListener("click", () => {

  const value = Number(salaryInput.value);

  if (value <= 0 || salaryInput.value === "") {
    alert("Enter valid salary");
    return;
  }

  salary = value;

  localStorage.setItem("salary", salary);

  updateUI();

  salaryInput.value = "";
});

// Add Expense
expenseBtn.addEventListener("click", () => {

  const name = expenseName.value.trim();

  const amount = Number(expenseAmount.value);

  if (
    name === "" ||
    amount <= 0 ||
    expenseAmount.value === ""
  ) {
    alert("Enter valid expense");
    return;
  }

  const expense = {
    id: Date.now(),
    name,
    amount
  };

  expenses.push(expense);

  localStorage.setItem(
    "expenses",
    JSON.stringify(expenses)
  );

  updateUI();

  expenseName.value = "";
  expenseAmount.value = "";
});

// Delete Expense
function deleteExpense(id) {

  expenses = expenses.filter(
    exp => exp.id !== id
  );

  localStorage.setItem(
    "expenses",
    JSON.stringify(expenses)
  );

  updateUI();
}

// Update UI
function updateUI() {

  const symbol = currencySymbols[currentCurrency];

  salaryCurrency.innerText = symbol;
  salaryCurrency2.innerText = symbol;
  salaryCurrency3.innerText = symbol;

  const convertedSalary =
    (salary * exchangeRate).toFixed(2);

  const totalExp = expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const convertedExpenses =
    (totalExp * exchangeRate).toFixed(2);

  const balance = salary - totalExp;

  const convertedBalance =
    (balance * exchangeRate).toFixed(2);

  totalSalary.innerText = convertedSalary;

  totalExpenses.innerText = convertedExpenses;

  remainingBalance.innerText = convertedBalance;

  // Threshold Alert
  if (salary > 0 && balance < salary * 0.1) {

    balanceText.classList.add("low-balance");

    alertBox.innerText =
      "⚠ Warning: Balance below 10%";

  } else {

    balanceText.classList.remove("low-balance");

    alertBox.innerText = "";
  }

  // Render Expenses
  expenseList.innerHTML = "";

  expenses.forEach(exp => {

    const li = document.createElement("li");

    li.innerHTML = `
      <span>
        ${exp.name} -
        ${symbol}${(
          exp.amount * exchangeRate
        ).toFixed(2)}
      </span>

      <button
        class="delete-btn"
        onclick="deleteExpense(${exp.id})"
      >
        Delete
      </button>
    `;

    expenseList.appendChild(li);
  });

  renderChart(
    convertedExpenses,
    convertedBalance
  );
}

// Chart.js
function renderChart(totalExp, balance) {

  const ctx = document.getElementById("myChart");

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {

    type: "pie",

    data: {

      labels: [
        "Expenses",
        "Remaining Balance"
      ],

      datasets: [{
        data: [totalExp, balance]
      }]
    },

    options: {
      responsive: true
    }
  });
}

// PDF Download
document
  .getElementById("downloadBtn")
  .addEventListener("click", () => {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    const symbol =
      currencySymbols[currentCurrency];

    doc.text(
      "Cash Flow Report",
      20,
      20
    );

    doc.text(
      `Salary: ${symbol}${totalSalary.innerText}`,
      20,
      40
    );

    let y = 60;

    expenses.forEach(exp => {

      doc.text(
        `${exp.name} - ${symbol}${(
          exp.amount * exchangeRate
        ).toFixed(2)}`,
        20,
        y
      );

      y += 10;
    });

    doc.text(
      `Remaining Balance: ${symbol}${remainingBalance.innerText}`,
      20,
      y + 20
    );

    doc.save("report.pdf");
});