"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const multer_1 = __importDefault(require("multer"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
/*
watch out for folder names before sending request or uploading.
adjust the mimetype to the file name with extension
*/
//initializing a s3 client
const s3 = new client_s3_1.S3Client({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});
//initialize multer for file uploads 
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
//get metadata of all files in the given bucket name
app.get("/list-files", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Bucket: "file-upload-frontend1702",
        Prefix: "",
    };
    try {
        const command = new client_s3_1.ListObjectsV2Command(params);
        const data = yield s3.send(command);
        const files = (data.Contents || []).map(file => ({
            Key: file.Key,
            LastModified: file.LastModified,
            Size: file.Size,
        }));
        res.json({
            message: "Successfull received",
            files: files,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            message: "Something went wrong"
        });
    }
}));
//get a particular file/image..etc url with presigned url with time limit 
app.get("/signed-url/:key", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Bucket: "file-upload-frontend1702",
        Key: req.params.key,
    };
    try {
        const command = new client_s3_1.GetObjectCommand(params);
        const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 120 });
        if (!url) {
            res.json({
                message: "image not found",
            });
        }
        res.json({
            message: "url received",
            url: url,
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            message: "Something went wrong"
        });
    }
}));
//uploading files from an api endpoint watch out for folder / foldernames
app.post("/upload", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    // const foldername = req.body.folder || "default-folder/"
    if (!file) {
        console.log();
        res.json({
            message: "file doesnot exist"
        });
        return;
    }
    const contentType = file.mimetype;
    console.log(contentType);
    const params = {
        Bucket: "file-upload-frontend1702",
        Key: "uploads/newimagefile", // Folder /foldername
        Body: file.buffer,
        ContentType: contentType,
    };
    // console.log(file?.buffer)
    // console.log(file?.mimetype)
    try {
        const command = new client_s3_1.PutObjectCommand(params);
        const data = yield s3.send(command);
        res.json({
            message: "File uploaded successfull",
            key: params.Key,
            data: data
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            message: "Something went wrong",
        });
    }
}));
app.delete("/delete-file/:key", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        Bucket: "file-upload-frontend1702",
        Key: req.params.key,
    };
    try {
        const command = new client_s3_1.DeleteObjectCommand(params);
        const data = yield s3.send(command);
        res.json({
            message: "Successfullly delted file"
        });
    }
    catch (error) {
        console.log(error);
        res.json({
            message: "something went wrong"
        });
    }
}));
app.listen(PORT, () => {
    console.log("Listening to port 3000");
});
