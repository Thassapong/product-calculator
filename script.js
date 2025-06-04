let productList = {};

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("products.json");
    productList = await res.json();
    addCustomer(); // เพิ่มลูกค้าแรกหลังโหลดสินค้าเสร็จ
  } catch (err) {
    alert("โหลดรายการสินค้าไม่สำเร็จ");
    console.error(err);
  }
});

function addCustomer() {
  const container = document.getElementById("customerContainer");

  const div = document.createElement("div");
  div.className = "customer-section";

  div.innerHTML = `
    <h2>ลูกค้าใหม่</h2>
    <input class="customer-name" placeholder="ชื่อลูกค้า" />
    <input class="customer-note" placeholder="หมายเหตุ" />
    <table>
      <thead>
        <tr>
          <th>สินค้า</th>
          <th>จำนวน</th>
          <th>ส่วนลด 1 (%)</th>
          <th>ส่วนลด 2 (%)</th>
          <th>ส่วนลด 3 (%)</th>
          <th>ราคาต่อหน่วย</th>
          <th>ราคาหลังลด</th>
          <th>รวม</th>
          <th>ลบ</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <button onclick="addRow(this)">➕ เพิ่มสินค้า</button>
  `;

  container.appendChild(div);
  addRow(div.querySelector("button"));
}

function addRow(button) {
  const tbody = button.closest(".customer-section").querySelector("tbody");
  const tr = document.createElement("tr");

  const options = Object.keys(productList)
    .map(p => `<option value="${p}">${p}</option>`)
    .join("");

  const firstProduct = Object.keys(productList)[0];
  const firstPrice = productList[firstProduct] || 0;

  tr.innerHTML = `
    <td><select onchange="updatePrice(this)">${options}</select></td>
    <td><input type="number" value="1" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="${firstPrice}" readonly /></td>
    <td><input type="number" value="${firstPrice}" readonly /></td>
    <td><input type="number" value="${firstPrice}" readonly /></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  tbody.appendChild(tr);
}

function updatePrice(select) {
  const row = select.closest("tr");
  const price = productList[select.value] || 0;
  row.cells[5].querySelector("input").value = price;
  calcRow(select);
}

function calcRow(input) {
  const row = input.closest("tr");
  const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
  const d1 = parseFloat(row.cells[2].querySelector("input").value) || 0;
  const d2 = parseFloat(row.cells[3].querySelector("input").value) || 0;
  const d3 = parseFloat(row.cells[4].querySelector("input").value) || 0;
  const price = parseFloat(row.cells[5].querySelector("input").value) || 0;

  const discountFactor = (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
  const finalPrice = price * discountFactor;
  const total = qty * finalPrice;

  row.cells[6].querySelector("input").value = finalPrice.toFixed(2);
  row.cells[7].querySelector("input").value = total.toFixed(2);
}

function removeRow(btn) {
  btn.closest("tr").remove();
}

// (ส่วนฟังก์ชัน downloadXLSX คงเดิมเหมือนเดิม ไม่ต้องแก้ไข)


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


