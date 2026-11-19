import multer from "multer";
import path from "node:path";

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, "../../public/uploads/images/products"));
//   }
// })

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const type = file.mimetype.split("/")[0];

    if(type === "image") {
      return cb(null, true)
    } else {
      return cb(new Error("Only image files are allowed")) 
    }
  }
})

export default upload.single("image");