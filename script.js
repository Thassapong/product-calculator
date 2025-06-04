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

  const salesOptions = ["NK","SW","TT","KC","KS","MS"]
    .map(s => `<option value="${s}">${s}</option>`).join("");

  const div = document.createElement("div");
  div.className = "customer-section";

  div.innerHTML = `
    <h2>Sale:
      <select class="sale-select">${salesOptions}</select>
    </h2>
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
      <tfoot>
        <tr>
          <td colspan="8" style="text-align:right"><b>ราคารวมทั้งหมด</b></td>
          <td><input class="total-price" value="0" readonly /></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <button onclick="addRow(this)">➕ เพิ่มสินค้า</button>
  `;

  container.appendChild(div);
  addRow(div.querySelector("button"));

  // ใส่ event listener อัพเดตราคารวมเมื่อข้อมูลเปลี่ยนแปลง
  div.addEventListener("input", () => {
    updateTotalPrice(div);
  });
}

function addRow(button) {
  const tbody = button.closest(".customer-section").querySelector("tbody");
  const tr = document.createElement("tr");

  const options = Object.keys(productList)
    .map(name => `<option value="${name}">${name}</option>`)
    .join("");

  // ค่าเริ่มต้นสินค้าและข้อมูล
  const firstProduct = Object.keys(productList)[0] || "";
  const { price = 0, unit = "" } = productList[firstProduct] || {};

  tr.innerHTML = `
    <td>
      <input type="text" class="product-search" placeholder="ค้นหาสินค้าหรือพิมพ์ชื่อเอง" list="product-list" oninput="onProductInput(this)" />
      <datalist id="product-list">${options}</datalist>
    </td>
    <td><input type="number" value="1" min="1" oninput="calcRow(this)" /></td>
    <td class="unit-cell">${unit}</td>
    <td><input type="number" value="0" min="0" max="100" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" min="0" max="100" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" min="0" max="100" oninput="calcRow(this)" /></td>
    <td><input type="number" value="${price}" oninput="calcRow(this)" /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  tbody.appendChild(tr);
  updateProductDetails(tr);
  updateTotalPrice(button.closest(".customer-section"));
}

function onProductInput(input) {
  const val = input.value.trim();
  const tr = input.closest("tr");

  if (productList[val]) {
    // สินค้าใน productList
    const data = productList[val];
    tr.cells[2].innerText = data.unit || "";
    const priceInput = tr.cells[6].querySelector("input");
    priceInput.value = data.price || 0;
    priceInput.readOnly = true;
  } else {
    // สินค้าใหม่
    tr.cells[2].innerText = "";
    const priceInput = tr.cells[6].querySelector("input");
    priceInput.value = 0;
    priceInput.readOnly = false;
  }
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

  const customerSection = input.closest(".customer-section");
  updateTotalPrice(customerSection);
}

function removeRow(btn) {
  const section = btn.closest(".customer-section");
  btn.closest("tr").remove();
  updateTotalPrice(section);
}

function updateTotalPrice(customerSection) {
  let sum = 0;
  const rows = customerSection.querySelectorAll("tbody tr");
  rows.forEach(tr => {
    const val = parseFloat(tr.cells[8].querySelector("input").value) || 0;
    sum += val;
  });
  customerSection.querySelector(".total-price").value = sum.toFixed(2);
}

function updateProductDetails(tr) {
  const productInput = tr.querySelector(".product-search");
  if (productInput) onProductInput(productInput);
}

function downloadXLSX() {
  const wb = XLSX.utils.book_new();
  const dateStr = getThaiDateString();
  const fileName = `ออเดอร์ ${dateStr}.xlsx`;

  const customers = document.querySelectorAll(".customer-section");

  customers.forEach((section, index) => {
    const saleName = section.querySelector(".sale-select").value || "";
    const name = section.querySelector(".customer-name").value || `ลูกค้า ${index + 1}`;
    const note = section.querySelector(".customer-note").value || "";

    const rows = Array.from(section.querySelectorAll("tbody tr")).map(tr => {

      let discounts = [];
      [3,4,5].forEach(i => {
        const v = tr.cells[i].querySelector("input").value;
        if (v && v !== "0") discounts.push(v + "%");
      });
      const discountText = discounts.join("");

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


    const ws_data = [];


    ws_data.push([`Sale: ${saleName}`, `         วันที่ ${dateStr}`]);

    ws_data.push([`ลูกค้า: ${name}`]);

    ws_data.push([`หมายเหตุ: ${note}`]);

    ws_data.push(["สินค้า","จำนวน","หน่วย","ราคาต่อหน่วย","ส่วนลด(%)","ราคาหลังลด","รวม"]);


    rows.forEach(r => {
      ws_data.push([
        r["สินค้า"],
        r["จำนวน"],
        r["หน่วย"],
        r["ราคาต่อหน่วย"],
        r["ส่วนลด(%)"],
        r["ราคาหลังลด"],
        r["รวม"],
      ]);
    });


    const total = section.querySelector(".total-price").value || "0";
    ws_data.push(["", "", "", "", "", "รวมราคาสินค้า", total]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 30));
  });

  XLSX.writeFile(wb, fileName);
}
