let productList = {};

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("products.json");
    productList = await res.json();
    addCustomer();
    document.getElementById("currentDate").innerText = getThaiDateString();
  } catch (err) {
    alert("โหลดรายการสินค้าไม่สำเร็จ");
    console.error(err);
  }
});

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
    <button onclick="addRow(this)">➕ เพิ่มสินค้า</button>
    <p><strong>ราคารวมทั้งหมด: </strong><span class="customer-total">0.00</span> บาท</p>
  `;

  container.appendChild(div);
  addRow(div.querySelector("button"));
  updateCustomerTotal(div); // อัพเดทราคาตอนเริ่มด้วย
}

function addRow(button) {
  const tbody = button.closest(".customer-section").querySelector("tbody");
  const tr = document.createElement("tr");

  // สร้าง input สำหรับค้นหาสินค้า
  const searchInputHTML = `<input type="text" class="product-search" placeholder="ค้นหาสินค้า..." oninput="filterProductOptions(this)" style="width: 100%; box-sizing: border-box;" />`;

  const options = Object.keys(productList)
    .map(name => `<option value="${name}">${name}</option>`)
    .join("");

  const firstProduct = Object.keys(productList)[0];
  const { price = 0, unit = "" } = productList[firstProduct];

  tr.innerHTML = `
    <td>
      ${searchInputHTML}
      <select onchange="updatePrice(this)">${options}</select>
    </td>
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
  updateCustomerTotal(button.closest(".customer-section")); // อัพเดทราคาเมื่อเพิ่มแถว
}

function filterProductOptions(input) {
  const filter = input.value.toLowerCase();
  const select = input.nextElementSibling; // select อยู่ถัดไป

  Array.from(select.options).forEach(option => {
    option.style.display = option.value.toLowerCase().includes(filter) ? "block" : "none";
  });

  // ถ้าค่าใน select ไม่อยู่ในตัวเลือกที่แสดง ให้เลือกตัวเลือกแรกที่แสดงแทน
  const visibleOptions = Array.from(select.options).filter(opt => opt.style.display !== "none");
  if (visibleOptions.length > 0) {
    if (!visibleOptions.some(opt => opt.value === select.value)) {
      select.value = visibleOptions[0].value;
      updatePrice(select);
    }
  }
}

function updatePrice(select) {
  const row = select.closest("tr");
  const selected = select.value;
  const data = productList[selected] || { price: 0, unit: "" };

  row.cells[2].innerText = data.unit || "";
  row.cells[6].querySelector("input").value = data.price || 0;
  calcRow(select);
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

  // อัพเดตราคารวมลูกค้า
  const customerSection = row.closest(".customer-section");
  updateCustomerTotal(customerSection);
}

function removeRow(btn) {
  const customerSection = btn.closest(".customer-section");
  btn.closest("tr").remove();
  updateCustomerTotal(customerSection);
}

function updateCustomerTotal(section) {
  const rows = section.querySelectorAll("tbody tr");
  let total = 0;
  rows.forEach(tr => {
    const sum = parseFloat(tr.cells[8].querySelector("input").value) || 0;
    total += sum;
  });
  section.querySelector(".customer-total").innerText = total.toFixed(2);
}

function downloadXLSX() {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = getThaiDateString();
  const fileName = `ออเดอร์ ${dateStr}.xlsx`;

  const customers = document.querySelectorAll(".customer-section");

  customers.forEach((section, index) => {
    const name = section.querySelector(".customer-name").value || `ลูกค้า ${index + 1}`;
    const note = section.querySelector(".customer-note").value || "";
    const rows = Array.from(section.querySelectorAll("tbody tr")).map(tr => {
      return {
        "สินค้า": tr.cells[0].querySelector("select").value,
        "จำนวน": tr.cells[1].querySelector("input").value,
        "หน่วย": tr.cells[2].innerText,
        "ส่วนลด 1 (%)": tr.cells[3].querySelector("input").value,
        "ส่วนลด 2 (%)": tr.cells[4].querySelector("input").value,
        "ส่วนลด 3 (%)": tr.cells[5].querySelector("input").value,
        "ราคาต่อหน่วย": tr.cells[6].querySelector("input").value,
        "ราคาหลังลด": tr.cells[7].querySelector("input").value,
        "รวม": tr.cells[8].querySelector("input").value
      };
    });

    rows.unshift({ "สินค้า": `หมายเหตุ: ${note}` });
    rows.unshift({ "สินค้า": `ลูกค้า: ${name}` });

    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 30));
  });

  XLSX.writeFile(wb, fileName);
}
