document.getElementById("codeForm").addEventListener("submit",function(e){
e.preventDefault();
var code=document.getElementById("code").value.trim();
if(!code){
document.getElementById("msg").innerText="请输入资格码";
return;
}
location.href="/draw.html?code="+encodeURIComponent(code);
});
