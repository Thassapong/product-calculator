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
    <h2>ลูกค้า</h2>
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
    <p><strong>ราคารวมทั้งหมด: <span id="grandTotalLabel">0.00</span> บาท</strong></p>
    <button onclick="addRow(this)">➕ เพิ่มสินค้า</button>
  `;

  container.appendChild(div);
  addRow(div.querySelector("button"));

  // อัพเดตราคารวมทุกครั้งที่มีการเปลี่ยนแปลงข้อมูลลูกค้า
  div.addEventListener("input", () => {
    updateGrandTotal();
  });

  updateGrandTotal();
}

function addRow(button) {
  const tbody = button.closest(".customer-section").querySelector("tbody");
  const tr = document.createElement("tr");

  const options = Object.keys(productList)
    .map(name => `<option value="${name}">${name}</option>`)
    .join("");

  const firstProduct = Object.keys(productList)[0] || "";
  const { price = 0, unit = "" } = productList[firstProduct] || {};

  tr.innerHTML = `
    <td>
      <input list="productList" class="product-input" oninput="onProductInput(this)" placeholder="พิมพ์ชื่อสินค้า" />
      <datalist id="productList">
        ${Object.keys(productList).map(name => `<option value="${name}">`).join("")}
      </datalist>
    </td>
    <td><input type="number" value="1" min="0" oninput="calcRow(this)" /></td>
    <td class="unit-cell">${unit}</td>
    <td><input type="number" value="0" min="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" min="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="0" min="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="${price}" min="0" oninput="calcRow(this)" /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><input type="number" value="${price}" readonly /></td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  tbody.appendChild(tr);
}

function onProductInput(input) {
  const row = input.closest("tr");
  const productName = input.value;
  const data = productList[productName];

  if (data) {
    row.cells[2].innerText = data.unit || "";
    row.cells[6].querySelector("input").value = data.price || 0;
  } else {
    // ถ้าไม่เจอสินค้าใน list ให้เคลียร์หน่วยและราคา
    row.cells[2].innerText = "";
    row.cells[6].querySelector("input").value = 0;
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

  updateGrandTotal();
}

function removeRow(btn) {
  btn.closest("tr").remove();
  updateGrandTotal();
}

function updateGrandTotal() {
  let grandTotal = 0;
  document.querySelectorAll(".customer-section").forEach(section => {
    const rows = section.querySelectorAll("tbody tr");
    rows.forEach(tr => {
      const val = parseFloat(tr.cells[8].querySelector("input").value) || 0;
      grandTotal += val;
    });
  });
  document.getElementById("grandTotalLabel").innerText = grandTotal.toFixed(2);
}

function downloadXLSX() {
  const wb = XLSX.utils.book_new();
  const dateStr = getThaiDateString();
  const fileName = `ออเดอร์ ${dateStr}.xlsx`;

  const saleName = document.getElementById("saleSelect").value || "";

  const customers = document.querySelectorAll(".customer-section");

  customers.forEach((section, index) => {
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

    ws_data.push([`Sale: ${saleName}`, `วันที่ ${dateStr}`]);
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

    const total = rows.reduce((acc, r) => acc + parseFloat(r["รวม"]) || 0, 0);
    ws_data.push(["", "", "", "", "", "รวมราคาสินค้า", total.toFixed(2)]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 30));
  });

  XLSX.writeFile(wb, fileName);
}
