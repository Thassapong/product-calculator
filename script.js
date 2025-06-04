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
    <label><strong>Sale :</strong> 
      <select class="sale-name">
        <option value="NK">NK</option>
        <option value="SW">SW</option>
        <option value="TT">TT</option>
        <option value="KC">KC</option>
        <option value="KS">KS</option>
        <option value="MS">MS</option>
      </select>
    </label>
    <input class="customer-name" placeholder="ชื่อลูกค้า" />
    <input class="customer-note" placeholder="หมายเหตุ" />
    <table>
      <thead>
        <tr>
          <th>สินค้า</th>
          <th>จำนวน</th>
          <th>หน่วย</th>
          <th>ส่วนลด(%)</th>
          <th>ส่วนลดตาม 1(%)</th>
          <th>ส่วนลดตาม 2(%)</th>
          <th>ราคาต่อหน่วย</th>
          <th>ราคาหลังลด</th>
          <th>รวม</th>
          <th>ลบ</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
    <div>ราคารวม: <span class="total-price">0.00</span></div>
    <button onclick="addRow(this)">➕ เพิ่มสินค้า</button>
  `;

  container.appendChild(div);
  addRow(div.querySelector("button"));
  updateTotalPrice(div);
}

function addRow(button) {
  const tbody = button.closest(".customer-section").querySelector("tbody");
  const tr = document.createElement("tr");

  const options = Object.keys(productList)
    .map(name => `<option value="${name}">${name}</option>`)
    .join("");

  const firstProduct = Object.keys(productList)[0];
  const { price = 0, unit = "" } = productList[firstProduct];

  tr.innerHTML = `
    <td>
      <input type="text" class="product-search" placeholder="ค้นหาสินค้า" oninput="filterOptions(this)" list="product-list" />
      <datalist id="product-list">${options}</datalist>
    </td>
    <td><input type="number" value="1" min="1" oninput="calcRow(this)" /></td>
    <td class="unit-cell">${unit}</td>
    <td><input type="number" value="0" min="0" max="100" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" min="0" max="100" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" min="0" max="100" oninput="calcRow(this)" /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  tbody.appendChild(tr);
  updateProductDetails(tr);
  updateTotalPrice(button.closest(".customer-section"));
}

function filterOptions(input) {
  const val = input.value.toLowerCase();
  const datalist = input.nextElementSibling; // <datalist>
  const options = datalist.querySelectorAll("option");
  let matched = false;

  options.forEach(opt => {
    if (opt.value.toLowerCase().includes(val)) {
      opt.style.display = "block";
      matched = true;
    } else {
      opt.style.display = "none";
    }
  });

  // ถ้าเจอผลลัพธ์ ให้ใช้ตัวแรกอัตโนมัติ (ถ้าต้องการ)
  if (matched) {
    // ไม่บังคับเลือกอัตโนมัติ ให้ user เลือกเอง
  }
  updateProductDetails(input.closest("tr"));
}

function updateProductDetails(row) {
  const input = row.querySelector(".product-search");
  const val = input.value;
  const data = productList[val] || { price: 0, unit: "" };

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

  updateTotalPrice(row.closest(".customer-section"));
}

function removeRow(btn) {
  const section = btn.closest(".customer-section");
  btn.closest("tr").remove();
  updateTotalPrice(section);
}

function updateTotalPrice(section) {
  const rows = section.querySelectorAll("tbody tr");
  let sum = 0;
  rows.forEach(row => {
    const val = parseFloat(row.cells[8].querySelector("input").value) || 0;
    sum += val;
  });
  section.querySelector(".total-price").innerText = sum.toFixed(2);
}

function downloadXLSX() {
  const wb = XLSX.utils.book_new();
  const dateStr = getThaiDateString();
  const fileName = `ออเดอร์ ${dateStr}.xlsx`;

  const customers = document.querySelectorAll(".customer-section");

  customers.forEach((section, index) => {
    const customerName = section.querySelector(".customer-name").value || `ลูกค้า ${index + 1}`;
    const sale = section.querySelector(".sale-name").value || "";
    const note = section.querySelector(".customer-note").value || "";

    const rows = Array.from(section.querySelectorAll("tbody tr")).map(tr => {
      // รวมส่วนลดเป็น string ตามข้อกำหนด
      const d1 = tr.cells[3].querySelector("input").value;
      const d2 = tr.cells[4].querySelector("input").value;
      const d3 = tr.cells[5].querySelector("input").value;
      const discountArr = [];
      if (d1 && d1 !== "0") discountArr.push(d1 + "%");
      if (d2 && d2 !== "0") discountArr.push(d2 + "%");
      if (d3 && d3 !== "0") discountArr.push(d3 + "%");
      const discountText = discountArr.join("");

      return {
        "สินค้า": tr.cells[0].querySelector("input").value,
        "จำนวน": tr.cells[1].querySelector("input").value,
        "หน่วย": tr.cells[2].innerText,
        "ราคาต่อหน่วย": tr.cells[6].querySelector("input").value,
        "ส่วนลด(%)": discountText,
        "ราคาหลังลด": tr.cells[7].querySelector("input").value,
        "รวม": tr.cells[8].querySelector("input").value
      };
    });

    // แทรกข้อมูลก่อนตารางตามคำขอ
    rows.unshift({ "สินค้า": `รวมราคา: ${section.querySelector(".total-price").innerText}` });
    rows.unshift({ "สินค้า": `หมายเหตุ: ${note}` });
    rows.unshift({ "สินค้า": `Sale: ${sale}` });
    rows.unshift({ "สินค้า": `ลูกค้า: ${customerName}` });
    rows.unshift({ "สินค้า": `วันที่ ${dateStr}` });

    // กำหนด header 7 คอลัมน์
    const ws = XLSX.utils.json_to_sheet(rows, { header: ["สินค้า", "จำนวน", "หน่วย", "ราคาต่อหน่วย", "ส่วนลด(%)", "ราคาหลังลด", "รวม"], skipHeader: false });

    XLSX.utils.book_append_sheet(wb, ws, customerName.substring(0, 30));
  });

  XLSX.writeFile(wb, fileName);
}
