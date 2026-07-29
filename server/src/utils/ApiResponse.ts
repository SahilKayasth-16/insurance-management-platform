class ApiResponse<T = unknown > {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null;

    constructor(statusCode: number,data: T | null, message: string = "Success") {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    };
};

export default ApiResponse;