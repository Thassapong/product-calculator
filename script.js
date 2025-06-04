let products = [];

window.onload = async function () {
  document.getElementById("todayDate").innerText = new Date().toLocaleDateString("th-TH");

  try {
    const res = await fetch("products.json");
    products = await res.json();
    addRow(); // เพิ่มแถวแรกหลังจากโหลดสินค้าเสร็จ
  } catch (error) {
    alert("ไม่สามารถโหลดรายการสินค้าได้");
  }
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
    <td><input type="number" value="1" min="1" oninput="calculateTotal()"></td>
    <td><input type="number" value="0" min="0" max="100" oninput="calculateTotal()"></td>
    <td><input type="number" value="0" min="0" max="100" oninput="calculateTotal()"></td>
    <td><input type="number" value="0" min="0" max="100" oninput="calculateTotal()"></td>
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
  calculateTotal(); // คำนวณใหม่เมื่อเลือกสินค้า
}

function removeRow(btn) {
  btn.closest("tr").remove();
  calculateTotal(); // คำนวณใหม่เมื่อมีการลบแถว
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
    const totalRow = qty * finalPrice;

    total += totalRow;
  });

  document.getElementById("totalPrice").innerText = total.toFixed(2);
}

function downloadXLSX() {
  const wb = XLSX.utils.book_new();

  const customerSections = document.querySelectorAll(".customer-section");

  customerSections.forEach((section, index) => {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = (date.getFullYear() + 543).toString().slice(-2); // พ.ศ.

    const customer = section.querySelector(".customer-name").value || `ลูกค้า${index + 1}`;
    const note = section.querySelector(".customer-note").value || "";

    const ws_data = [];
    ws_data.push(["วันที่", "ชื่อลูกค้า", "หมายเหตุ"]);
    ws_data.push([`${dd}/${mm}/${yy}`, customer, note]);
    ws_data.push([]);
    ws_data.push(["สินค้า", "จำนวน", "ส่วนลด1", "ส่วนลด2", "ส่วนลด3", "ราคาต่อหน่วย", "ราคาหลังลด", "รวม"]);

    let total = 0;

    const rows = section.querySelectorAll("tbody tr");

    rows.forEach(row => {
      const name = row.cells[0].querySelector("select").value;
      const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
      const d1 = parseFloat(row.cells[2].querySelector("input").value) || 0;
      const d2 = parseFloat(row.cells[3].querySelector("input").value) || 0;
      const d3 = parseFloat(row.cells[4].querySelector("input").value) || 0;
      const price = parseFloat(row.cells[5].querySelector("input").value) || 0;

      const discountFactor = (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
      const finalPrice = price * discountFactor;
      const totalRow = qty * finalPrice;
      total += totalRow;

      ws_data.push([name, qty, d1, d2, d3, price, finalPrice.toFixed(2), totalRow.toFixed(2)]);
    });

    ws_data.push([]);
    ws_data.push(["รวมทั้งสิ้น", "", "", "", "", "", "", total.toFixed(2) + " บาท"]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const sheetName = customer.length > 31 ? customer.slice(0, 31) : customer;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // สร้างชื่อไฟล์: ออเดอร์ DD-MM-YY
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = (now.getFullYear() + 543).toString().slice(-2); // พ.ศ.
  const filename = `ออเดอร์ ${dd}-${mm}-${yy}.xlsx`;

  XLSX.writeFile(wb, filename);
}


