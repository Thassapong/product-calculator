let products = [];

window.onload = function () {
  document.getElementById("todayDate").innerText = new Date().toLocaleDateString("th-TH");
  fetch("products.json")
    .then(res => res.json())
    .then(data => {
      products = data;
      addRow(); // เพิ่มแถวแรกเลย
    });
};

function addRow() {
  const table = document.querySelector("#productTable tbody");
  const row = document.createElement("tr");

  const selectHTML = products.map(p => `<option value="${p.name}">${p.name}</option>`).join("");

  row.innerHTML = `
    <td>
      <select onchange="updatePrice(this)">
        <option value="">-- เลือกสินค้า --</option>
        ${selectHTML}
      </select>
    </td>
    <td><input type="number" value="1" min="1"></td>
    <td><input type="number" value="0" min="0" max="100"></td>
    <td><input type="number" value="0" min="0" max="100"></td>
    <td><input type="number" value="0" min="0" max="100"></td>
    <td><input type="text" readonly></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  table.appendChild(row);
}

function updatePrice(selectElement) {
  const productName = selectElement.value;
  const product = products.find(p => p.name === productName);
  const row = selectElement.closest("tr");
  if (product) {
    row.cells[5].querySelector("input").value = product.price;
  } else {
    row.cells[5].querySelector("input").value = "";
  }
}

function removeRow(btn) {
  btn.closest("tr").remove();
}

function calculateTotal() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  let total = 0;

  rows.forEach(row => {
    const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
    const d1 = parseFloat(row.cells[2].querySelector("input").value) || 0;
    const d2 = parseFloat(row.cells[3].querySelector("input").value) || 0;
    const d3 = parseFloat(row.cells[4].querySelector("input").value) || 0;
    const price = parseFloat(row.cells[5].querySelector("input").value) || 0;

    const discountFactor = (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
    const finalPrice = price * discountFactor;
    total += qty * finalPrice;
  });

  document.getElementById("totalPrice").innerText = total.toFixed(2);
}

function downloadCSV() {
  const rows = document.querySelectorAll("#productTable tbody tr");
  let csv = "วันที่,ชื่อลูกค้า,หมายเหตุ\n";
  csv += `${document.getElementById("todayDate").innerText},${document.getElementById("customerName").value},${document.getElementById("note").value}\n\n`;

  csv += "สินค้า,จำนวน,ส่วนลด1,ส่วนลด2,ส่วนลด3,ราคาต่อหน่วย,ราคาหลังลด,รวม\n";

  rows.forEach(row => {
    const name = row.cells[0].querySelector("select").value;
    const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
    const d1 = parseFloat(row.cells[2].querySelector("input").value) || 0;
    const d2 = parseFloat(row.cells[3].querySelector("input").value) || 0;
    const d3 = parseFloat(row.cells[4].querySelector("input").value) || 0;
    const price = parseFloat(row.cells[5].querySelector("input").value) || 0;

    const discountFactor = (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
    const finalPrice = price * discountFactor;
    const total = qty * finalPrice;

    csv += `${name},${qty},${d1},${d2},${d3},${price},${finalPrice.toFixed(2)},${total.toFixed(2)}\n`;
  });

  csv += `\nราคารวม,,${document.getElementById("totalPrice").innerText} บาท`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ใบเสนอราคา.csv";
  link.click();
}
