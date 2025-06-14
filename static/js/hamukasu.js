let hamukasuCaptchaSetting = {
  onSuccess: function () {},
  onFailed: function () {},
};

function waitForNonstress(callback) {
  const interval = setInterval(() => {
    if (typeof nonstress !== "undefined" && typeof nonstress.getToken === "function") {
      clearInterval(interval);
      callback();
    }
  }, 50);
}

document.addEventListener("DOMContentLoaded", () => {
  waitForNonstress(() => {
    let lastValue = nonstress.getToken();

    setInterval(() => {
      const currentToken = nonstress.getToken();
      if (currentToken !== lastValue) {
        lastValue = currentToken;

        const resultElem = document.querySelector(".hamukasu-ui-result");
        const imageElem = document.querySelector(".hamukasu-ui-image");

        if (currentToken === "Failed") {
          resultElem.textContent = "Failed!";
          imageElem.setAttribute("src", "/static/img/x-circle-fill.svg");
          imageElem.classList.add("failed");
          if (hamukasuCaptchaSetting.onFailed) hamukasuCaptchaSetting.onFailed();
        } else {
          resultElem.textContent = "Success!";
          imageElem.setAttribute("src", "/static/img/check-circle-fill.svg");
          imageElem.classList.add("success");
          if (hamukasuCaptchaSetting.onSuccess) hamukasuCaptchaSetting.onSuccess();
        }
      }
    }, 100);
  });
});
