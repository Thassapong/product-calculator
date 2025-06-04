function addRow() {
  const table = document.querySelector("#productTable tbody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text" placeholder="ชื่อสินค้า"></td>
    <td><input type="number" value="1" min="1"></td>
    <td><input type="number" value="0" min="0"></td>
    <td><input type="number" value="0" min="0" max="100"></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  table.appendChild(row);
}

function removeRow(button) {
  button.closest("tr").remove();
}

function calculateTotal() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  let total = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
    const price = parseFloat(row.cells[2].querySelector("input").value) || 0;
    const discount = parseFloat(row.cells[3].querySelector("input").value) || 0;

    const discountedPrice = price * (1 - discount / 100);
    total += qty * discountedPrice;
  });

  document.getElementById("totalPrice").innerText = total.toFixed(2);
}

function downloadCSV() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  let csv = "สินค้า,จำนวน,ราคาต่อหน่วย,ส่วนลด (%),ราคารวม\n";

  rows.forEach(row => {
    const product = row.cells[0].querySelector("input").value;
    const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
    const price = parseFloat(row.cells[2].querySelector("input").value) || 0;
    const discount = parseFloat(row.cells[3].querySelector("input").value) || 0;
    const discountedPrice = price * (1 - discount / 100);
    const total = qty * discountedPrice;

    csv += `${product},${qty},${price},${discount},${total.toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "รายการสินค้า.csv";
  link.click();
}
