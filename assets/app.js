
const input = document.getElementById("codeInput");
const btn = document.getElementById("drawBtn");
const statusText = document.getElementById("statusText");
const resultBox = document.getElementById("resultBox");

async function draw(){
  const code = input.value.trim();
  if(!code){
    alert("请输入资格码");
    return;
  }

  statusText.textContent = "请求中...";
  btn.disabled = true;

  try{
    const resp = await fetch(`/api/redeem?code=${encodeURIComponent(code)}`, {
      cache:"no-store"
    });

    const data = await resp.json();

    if(data && data.ok){
      statusText.textContent = "成功";
      resultBox.style.display = "block";
      resultBox.innerHTML = `<h2>恭喜获得：${data.prize}</h2><p>请截图发送客服核实。</p>`;
    }else{
      statusText.textContent = "失败";
      resultBox.style.display = "block";
      resultBox.innerHTML = `<h2>${data.msg || "资格码无效或已使用"}</h2>`;
    }

  }catch(e){
    statusText.textContent = "网络异常";
    resultBox.style.display = "block";
    resultBox.innerHTML = "<h2>网络异常，请稍后重试</h2>";
  }

  btn.disabled = false;
}

btn.addEventListener("click", draw);
