Popkain.elements = []; // Tạo mảng lưu trữ phần tử để biết modal nào đang bật lên

// Tạo ra hàm tạo giá trị ko truyền là 1 đối tượng rỗng
function Popkain(options = {}) {
    // Nếu không truyền 2 giá trị content và templateId thì sẽ thông báo lỗi và dừng
    if (!options.content && !options.templateId) {
        console.error("You must provide one of 'content' or 'templateId'.");
        return;
    }

    //Nếu truyền cả 2 giá trị content và templateId sẽ chỉ nhận content còn templateId sẽ nhận giá trị null
    if (options.content && options.templateId) {
        options.templateId = null;
        console.warn(
            "Both 'content' and 'templateId' are specified. 'content' will take precedence, and 'templateId' will be ignored."
        );
    }

    //Nếu templateId có giá trị sẽ gán thuộc tính this.template ,gọi ra phần tử đó từ templateId nếu không gọi được sẽ báo lỗi
    if (options.templateId) {
        this.template = document.querySelector(`#${options.templateId}`);

        if (!this.template) {
            console.error(`#${options.templateId} does not exist!`);
            return;
        }
    }
    // tạo ra 1 thuộc tính đối tượng this.opt, các thuộc tính mặc định được nối vào đối tượng options
    this.opt = Object.assign(
        {
            //Bật khoá cuộn
            enableScrollLock: true,
            //Xoá phần tử sau khi tắt
            destroyOnClose: true,
            //Có footer hay không
            footer: false,
            //Class xem được thêm vào container của phần tử để tuỳ chỉnh
            cssClass: [],
            //Các lựa chọn khi tắt modal
            closeMethods: ["button", "overlay", "escape"],
            //Chỉ định khoá cuộn phần tử đích
            scrollLockTarget: () => document.body,
        },
        options
    );

    //Tạo ra thuộc tính this.content và gán tham số từ đối tượng trên
    this.content = this.opt.content;
    //Tạo ra biến closeMethods , closeMethods = this.opt.closeMethods
    const { closeMethods } = this.opt;
    //Có cho phép tắt modal bằng nút button không
    this._allowButtonClose = closeMethods.includes("button");
    //Có cho phép tắ modal bằng cách ấn vào lớp phủ không
    this._allowBackdropClose = closeMethods.includes("overlay");
    //Có cho phép tắt bằng phím escape không
    this._allowEscapeClose = closeMethods.includes("escape");

    //Tạo ra thuộc tính là mảng chứa các nút
    this._footerButtons = [];

    //Tạo ra hàm sử lý sự kiên
    this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

Popkain.prototype._build = function () {
    const contentNode = this.content ? document.createElement("div") : this.template.content.cloneNode(true);
    if (this.content) {
        contentNode.innerHTML = this.content;
    }

    this._backdrop = document.createElement("div");
    this._backdrop.className = "popkain";

    const container = document.createElement("div");
    container.className = "popkain__container";

    this.opt.cssClass.forEach((className) => {
        if (typeof className === "string") {
            container.classList.add(className);
        }
    });

    if (this._allowButtonClose) {
        const closeBtn = this._createButton("&times;", "popkain__close", () => this.close());
        container.append(closeBtn);
    }

    this._popkainContent = document.createElement("div");
    this._popkainContent.className = "popkain__content";
    this._popkainContent.append(contentNode);
    container.append(this._popkainContent);

    if (this.opt.footer) {
        this._popkainFooter = document.createElement("div");
        this._popkainFooter.className = "popkain__footer";

        this._renderFooterContent();
        this._renderFooterButtons();

        container.append(this._popkainFooter);
    }

    this._backdrop.append(container);
    document.body.append(this._backdrop);
};

Popkain.prototype.setContent = function (content) {
    this.content = content;
    if (this._popkainContent) {
        this._popkainContent.innerHTML = this.content;
    }
};

Popkain.prototype.setFooterContent = function (content) {
    this._footerContent = content;
    this._renderFooterContent();
};

Popkain.prototype._renderFooterContent = function () {
    if (this._popkainFooter && this._footerContent) {
        this._popkainFooter.innerHTML = this._footerContent;
    }
};

Popkain.prototype.addFooterButton = function (title, cssClass, callback) {
    const button = this._createButton(title, cssClass, callback);
    this._footerButtons.push(button);
    this._renderFooterButtons();
};

Popkain.prototype._renderFooterButtons = function () {
    if (this._popkainFooter) {
        this._footerButtons.forEach((button) => {
            this._popkainFooter.append(button);
        });
    }
};

Popkain.prototype._createButton = function (title, cssClass, callback) {
    const button = document.createElement("button");
    button.innerHTML = title;
    button.className = cssClass;
    button.onclick = callback;

    return button;
};

Popkain.prototype.open = function () {
    Popkain.elements.push(this);

    if (!this._backdrop) {
        this._build();
    }

    setTimeout(() => {
        this._backdrop.classList.add("popkain--show");
    }, 0);

    if (Popkain.elements.length === 1 && this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();

        if (this._hasScrollbar(target)) {
            target.classList.add("popkain--no-scroll");
            const targetPadRight = parseFloat(getComputedStyle(target).paddingRight);
            target.style.paddingRight = targetPadRight + this._getScrollbarWidth() + "px";
        }
    }

    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        };
    }

    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscapeKey);
    }

    this._onTransitionEnd(this.opt.onOpen);

    return this._backdrop;
};

Popkain.prototype._handleEscapeKey = function (e) {
    const lastModal = Popkain.elements[Popkain.elements.length - 1];
    if (e.key === "Escape" && this === lastModal) {
        this.close();
    }
};

Popkain.prototype._onTransitionEnd = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== "transform") return;
        if (typeof callback === "function") callback();
    };
};

Popkain.prototype._hasScrollbar = (target) => {
    if ([document.documentElement, document.body].includes(target)) {
        return (
            document.documentElement.scrollHeight > document.documentElement.clientHeight ||
            document.body.scrollHeight > document.body.clientHeight
        );
    }
    return target.scrollHeight > target.clientHeight;
};

Popkain.prototype.close = function (destroy = this.opt.destroyOnClose) {
    Popkain.elements.pop();

    this._backdrop.classList.remove("popkain--show");

    if (this._allowEscapeClose) {
        document.removeEventListener("keydown", this._handleEscapeKey);
    }

    this._onTransitionEnd(() => {
        if (this._backdrop && destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._popkainFooter = null;
        }

        if (this.opt.enableScrollLock && !Popkain.elements.length) {
            const target = this.opt.scrollLockTarget();

            if (this._hasScrollbar(target)) {
                target.classList.remove("popkain--no-scroll");
                target.style.paddingRight = "";
            }
        }

        if (typeof this.opt.onClose === "function") this.opt.onClose();
    });
};

Popkain.prototype.destroy = function () {
    this.close(true);
};

Popkain.prototype._getScrollbarWidth = function () {
    if (this._scrollbarWidth) return this._scrollbarWidth;

    const div = document.createElement("div");
    Object.assign(div.style, {
        overflow: "scroll",
        position: "absolute",
        top: "-9999px",
    });

    document.body.appendChild(div);
    this._scrollbarWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);

    return this._scrollbarWidth;
};
