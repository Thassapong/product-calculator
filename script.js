let productList = {};

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("products.json");
    productList = await res.json();
    fillProductListDatalist();
    addCustomer();
    document.getElementById("currentDate").innerText = getThaiDateString();
  } catch (err) {
    alert("โหลดรายการสินค้าไม่สำเร็จ");
    console.error(err);
  }
});

function fillProductListDatalist() {
  const datalist = document.getElementById("product-list");
  datalist.innerHTML = Object.keys(productList)
    .map(name => `<option value="${name}"></option>`)
    .join("");
}

function getThaiDateString() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear() + 543;
  return `${day}-${month}-${year.toString().slice(-2)}`;
}

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
          <th>หน่วย</th>
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
    <h3>ราคารวม: <span class="customer-total">0.00</span> บาท</h3>
    <button onclick="addRow(this)">➕ เพิ่มสินค้า</button>
  `;

  container.appendChild(div);
  addRow(div.querySelector("button"));
}

function addRow(button) {
  const tbody = button.closest(".customer-section").querySelector("tbody");
  const tr = document.createElement("tr");

  const firstProduct = Object.keys(productList)[0];
  const { price = 0, unit = "" } = productList[firstProduct] || {};

  tr.innerHTML = `
    <td><input list="product-list" value="${firstProduct}" oninput="updatePriceInput(this)" /></td>
    <td><input type="number" value="1" oninput="calcRow(this)" /></td>
    <td class="unit-cell">${unit}</td>
    <td><input type="number" value="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  tbody.appendChild(tr);
  updatePriceInput(tr.cells[0].querySelector("input"));
}

function updatePriceInput(input) {
  const row = input.closest("tr");
  const selected = input.value;
  const data = productList[selected] || { price: 0, unit: "" };

  row.cells[2].innerText = data.unit || "";
  row.cells[6].querySelector("input").value = data.price || 0;
  calcRow(input);
}

function calcRow(input) {
  const row = input.closest("tr");
  const qty = parseFloat(row.cells[1].querySelector("input").value) || 0;
  const d1 = parseFloat(row.cells[3].querySelector("input").value) || 0;
  const d2 = parseFloat(row.cells[4].querySelector("input").value) || 0;
  const d3 = parseFloat(row.cells[5].querySelector("input").value) || 0;
  const price = parseFloat(row.cells[6].querySelector("input").value) || 0;

  const discountFactor = (1 - d1 / 100) * (1 - d2 / 100) * (1 - d3 / 100);
  const finalPrice = price * discountFactor;
  const total = qty * finalPrice;

  row.cells[7].querySelector("input").value = finalPrice.toFixed(2);
  row.cells[8].querySelector("input").value = total.toFixed(2);

  updateCustomerTotal(row.closest(".customer-section"));
}

function updateCustomerTotal(section) {
  const rows = section.querySelectorAll("tbody tr");
  let total = 0;
  rows.forEach(row => {
    const val = parseFloat(row.cells[8].querySelector("input").value) || 0;
    total += val;
  });
  section.querySelector(".customer-total").innerText = total.toFixed(2);
}

function removeRow(btn) {
  const section = btn.closest(".customer-section");
  btn.closest("tr").remove();
  updateCustomerTotal(section);
}

function downloadXLSX() {
  const wb = XLSX.utils.book_new();
  const dateStr = getThaiDateString();
  const fileName = `ออเดอร์ ${dateStr}.xlsx`;
  const customers = document.querySelectorAll(".customer-section");

  customers.forEach((section, index) => {
    const name = section.querySelector(".customer-name").value || `ลูกค้า ${index + 1}`;
    const note = section.querySelector(".customer-note").value || "";
    const rows = [];

    rows.push([dateStr]);
    rows.push([`ลูกค้า: ${name}`]);
    rows.push([`หมายเหตุ: ${note}`]);

    const headers = [
      "สินค้า", "จำนวน", "หน่วย", "ราคาต่อหน่วย", "ส่วนลด(%)", "ราคาหลังลด", "รวม"
    ];
    rows.push(headers);

    let sumTotal = 0;


    section.querySelectorAll("tbody tr").forEach(tr => {
      const discountParts = [
        tr.cells[3].querySelector("input").value,
        tr.cells[4].querySelector("input").value,
        tr.cells[5].querySelector("input").value
      ].filter(p => parseFloat(p) > 0);

      const discountText = discountParts.map(p => `${p}%`).join("");

      const total = parseFloat(tr.cells[8].querySelector("input").value) || 0;
      sumTotal += total;

      rows.push([
        tr.cells[0].querySelector("select").value,
        tr.cells[1].querySelector("input").value,
        tr.cells[2].innerText,
        tr.cells[6].querySelector("input").value,
        discountText,
        tr.cells[7].querySelector("input").value,
        tr.cells[8].querySelector("input").value
      ]);
    });

    rows.push(["", "", "", "", "", "รวมทั้งหมด", sumTotal.toFixed(2)]);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 30));
  });

  XLSX.writeFile(wb, fileName);
}

