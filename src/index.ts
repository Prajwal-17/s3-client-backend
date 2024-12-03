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