import express from "express"
import dotenv from "dotenv"
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer"

dotenv.config();

const app = express();
app.use(express.json())
const PORT = process.env.PORT || 3000;

/*
watch out for folder names before sending request or uploading.
adjust the mimetype to the file name with extension
*/

//initializing a s3 client
const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  }
})

//initialize multer for file uploads 
const storage = multer.memoryStorage();
const upload = multer({ storage });

//uploading files from an api endpoint watch out for folder / foldernames
app.post("/upload", upload.single("file"), async (req, res) => {

  const file = req.file;
  const filename = req.file?.originalname;
  // const foldername = req.body.folder || "default-folder/"

  if (!file) {
    console.log()
    res.json({
      message: "file doesnot exist"
    })
    return
  }

  const params = {
    Bucket: "file-upload-frontend1702",
    Key: filename, // Folder /foldername -> provide filename with extension
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {

    const command = new PutObjectCommand(params);
    const data = await s3.send(command);

    res.json({
      message: "File uploaded successfull",
      key: params.Key,
      data: data
    })

  } catch (error) {
    console.log(error)
    res.json({
      message: "Something went wrong",
    })
  }
})

//get metadata of all files in the given bucket name
app.get("/list-files", async (req, res) => {

  const params = {
    Bucket: "file-upload-frontend1702",
    Prefix: "",
  }
  try {

    const command = new ListObjectsV2Command(params);
    const data = await s3.send(command)

    const files = (data.Contents || []).map(file => ({
      Key: file.Key,
      LastModified: file.LastModified,
      Size: file.Size,
    }))

    res.json({
      message: "Successfull received",
      files: files,
    })

  } catch (error) {
    console.log(error)
    res.json({
      message: "Something went wrong"
    })
  }
});

//get a particular file/image..etc url with presigned url with time limit 
app.get("/signed-url/:key", async (req, res) => {

  const params = {
    Bucket: "file-upload-frontend1702",
    Key: req.params.key,
  }

  try {

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 120 });

    if (!url) {
      res.json({
        message: "image not found",
      })
    }

    res.json({
      message: "url received",
      url: url,
    })
  } catch (error) {
    console.log(error)
    res.json({
      message: "Something went wrong"
    })
  }
})

app.get("/download/:filename", async (req, res) => {

  const filename = req.params.filename;

  try {

    const command = new GetObjectCommand({
      Bucket: "file-upload-frontend1702",
      Key: filename, //`uploads/${filename}`
    })

    const fileStream = await s3.send(command);

    if (!fileStream.Body || !(fileStream.Body as any).pipe) {
      throw new Error("File stream is not available or is not a readable stream");
    }

    //NodeJs.ReadableStream a type in node js for representing readable streams
    const stream = fileStream.Body as NodeJS.ReadableStream;

    /**
     * set header as file attachment
     * Content-Disposition is an HTTP header field that provides information on how to process the response payload.
     * Content Type indicates the ext of file eg: .jpg/.png ...
     */

    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.setHeader("Content-Type", fileStream.ContentType as string || "application/octet-stream")

    /**
     * pipe method is used to direct ouptut of the readable stream to writable stream(res)
     * This ensures that the content of the stream is sent directly to the client without buffering the entire content in memory.
     */
    stream.pipe(res);

  } catch (error) {
    console.log(error)
    res.json({
      message: "Something went wrong"
    })
  }
})

//delete an object from s3s
app.delete("/delete-file/:key", async (req, res) => {

  const params = {
    Bucket: "file-upload-frontend1702",
    Key: req.params.key,
  }

  try {

    const command = new DeleteObjectCommand(params);
    const data = await s3.send(command);

    res.json({
      message: "Successfullly delted file"
    })

  } catch (error) {
    console.log(error)
    res.json({
      message: "something went wrong"
    })
  }
})

app.listen(PORT, () => {
  console.log("Listening to port 3000")
})