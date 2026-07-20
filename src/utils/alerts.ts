import SweetAlert from "sweetalert2";

/**
 * @description 用於顯示錯誤訊息的 Alert
 * @param {string} text - 要顯示的訊息內容
 */
const showErrorAlert = (text: string) => {
  return SweetAlert.fire({
    icon: "error",
    title: "錯誤",
    text,
  });
};

/**
 * @description 用於顯示成功訊息的 Alert
 * @param {string} text - 要顯示的訊息內容
 */
const showSuccessAlert = (text: string) => {
  return SweetAlert.fire({
    icon: "success",
    title: "成功",
    text,
    timer: 1500,
    showConfirmButton: false,
  });
};


/**
 * @description 用於顯示警告訊息的 Alert
 * @param {string} text - 要顯示的訊息內容
 */
const showWarningAlert = (text: string) => {
  return SweetAlert.fire({
    icon: "warning",
    title: "警告",
    text,
  });
};

export {
  showErrorAlert,
  showSuccessAlert,
  showWarningAlert,
};