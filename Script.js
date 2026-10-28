
const STORAGE_KEY = "bankManagementAccounts";

const form = document.getElementById("accountForm");
const table = document.getElementById("accountTable");
const searchInput = document.getElementById("searchInput");
const cancelBtn = document.getElementById("cancelBtn");
const submitBtn = document.getElementById("submitBtn");

let accounts = loadAccounts();

function loadAccounts() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveAccounts() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(accounts)
        );
        return true;
    } catch {
        alert("Unable to save data in browser storage.");
        return false;
    }
}

function getInput(id) {
    return document.getElementById(id).value.trim();
}

function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);
}

// CREATE and UPDATE
form.addEventListener("submit", function (event) {
    event.preventDefault();

    const id = getInput("editId");
    const accountNumber = getInput("accountNumber");
    const customerName = getInput("customerName");
    const email = getInput("email");
    const phone = getInput("phone");
    const accountType = getInput("accountType");
    const balanceText = getInput("balance");
    const balance = Number(balanceText);

    if (
        !accountNumber ||
        !customerName ||
        !email ||
        !phone ||
        !accountType ||
        balanceText === "" ||
        !Number.isFinite(balance) ||
        balance < 0
    ) {
        alert("Please enter valid account details.");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        alert("Phone number must contain exactly 10 digits.");
        return;
    }

    const duplicate = accounts.some(account =>
        account.accountNumber === accountNumber &&
        account.id !== id
    );

    if (duplicate) {
        alert("This account number already exists.");
        return;
    }

    const account = {
        id: id || (
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : Date.now().toString() + Math.random().toString(36).slice(2)
        ),
        accountNumber,
        customerName,
        email,
        phone,
        accountType,
        balance
    };

    const previousAccounts = [...accounts];

    if (id) {
        accounts = accounts.map(item =>
            item.id === id ? account : item
        );
    } else {
        accounts.push(account);
    }

    if (!saveAccounts()) {
        accounts = previousAccounts;
        return;
    }

    resetForm();
    renderAccounts();

    alert(id
        ? "Account updated successfully!"
        : "Account created successfully!"
    );
});

// READ
function renderAccounts() {
    const query = searchInput.value.trim().toLowerCase();

    const filteredAccounts = accounts.filter(account =>
        account.customerName.toLowerCase().includes(query) ||
        account.accountNumber.toLowerCase().includes(query)
    );

    table.replaceChildren();

    filteredAccounts.forEach(account => {
        const row = document.createElement("tr");

        const values = [
            account.accountNumber,
            account.customerName,
            account.email,
            account.phone,
            account.accountType,
            formatMoney(account.balance)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            // Use textContent to avoid interpreting user input as HTML.
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actions = document.createElement("td");
        const buttonGroup = document.createElement("div");
        buttonGroup.className = "action-buttons";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-edit";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editAccount(account.id));

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-delete";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteAccount(account.id));

        buttonGroup.append(editButton, deleteButton);
        actions.appendChild(buttonGroup);
        row.appendChild(actions);
        table.appendChild(row);
    });

    document.getElementById("totalAccounts").textContent =
        accounts.length;

    const total = accounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0
    );

    document.getElementById("totalBalance").textContent =
        formatMoney(total);

    document.getElementById("emptyMessage").hidden =
        filteredAccounts.length !== 0;
}

// UPDATE: Load the selected record into the form.
function editAccount(id) {
    const account = accounts.find(item => item.id === id);

    if (!account) {
        alert("Account not found.");
        return;
    }

    document.getElementById("editId").value = account.id;
    document.getElementById("accountNumber").value = account.accountNumber;
    document.getElementById("customerName").value = account.customerName;
    document.getElementById("email").value = account.email;
    document.getElementById("phone").value = account.phone;
    document.getElementById("accountType").value = account.accountType;
    document.getElementById("balance").value = account.balance;

    document.getElementById("formTitle").textContent = "Update Account";
    submitBtn.textContent = "Update Account";
    cancelBtn.hidden = false;

    document.getElementById("accountNumber").focus();
    document.getElementById("accountForm").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// DELETE
function deleteAccount(id) {
    const account = accounts.find(item => item.id === id);

    if (!account) {
        alert("Account not found.");
        return;
    }

    const confirmed = confirm(
        `Delete account ${account.accountNumber} belonging to ${account.customerName}?`
    );

    if (!confirmed) return;

    const previousAccounts = [...accounts];
    accounts = accounts.filter(item => item.id !== id);

    if (!saveAccounts()) {
        accounts = previousAccounts;
        return;
    }

    if (getInput("editId") === id) {
        resetForm();
    }

    renderAccounts();
    alert("Account deleted successfully!");
}

// Cancel editing / clear the form.
function resetForm() {
    form.reset();
    document.getElementById("editId").value = "";
    document.getElementById("formTitle").textContent = "Add New Account";
    submitBtn.textContent = "Add Account";
    cancelBtn.hidden = true;
}

cancelBtn.addEventListener("click", resetForm);

searchInput.addEventListener("input", renderAccounts);

// Display saved records when the application starts.
renderAccounts();
