import React, { useEffect, useState } from "react";
import { storage } from "../../firebase";
import { deleteObject, getDownloadURL, getStorage, listAll, ref, uploadBytesResumable } from "firebase/storage";
import { TableCell, TableRow, Typography, Button, Grid } from "@mui/material";
import './file.scss'


const FileUploadDownload = () => {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState([]);
  const [progress, setProgress] = useState(0);
  const [user] = useState(JSON.parse(localStorage.getItem("userInfo")));
  const [isUpdate, setIsUpdate] = useState(true);

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };
  useEffect(() => {
    const fetchFiles = async () => {
      const fileList = await listAll(ref(storage, `/files/`))
      const promises = fileList.items.map(item => getDownloadURL(item));
      const urls = await Promise.all(promises);
      setUrl(
        fileList.items.map((item, i) => ({
          name: item.name,
          url: urls[i]
        }))
      );
    };
    fetchFiles();
  }, [isUpdate]);

  const handleUpload = () => {
    const storageRef = ref(storage, `/files/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        ); // update progress
        setProgress(percent);
      },
      (err) => console.log(err),
      () => {
        // download url
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          // setUrl(url)
          setIsUpdate(!isUpdate);
        });
      }
    );
  };

  const removeFile = async (fileURL) => {
    const storage = getStorage();
    const desertRef = ref(storage, fileURL);
    deleteObject(desertRef).then(() => {
      // File deleted successfully
      // console.log('successfully')
      setIsUpdate(!isUpdate);
    }).catch((error) => {
      console.log('error')
      // Uh-oh, an error occurred!
    });
  };

  return (
    <>
      {(user.role === 0 || user.role === 1) &&
        <>
          <Button variant="outlined" component="label" sx={{
            color: 'crimson',
            border: " 1px dotted rgba(220, 20, 60, 0.6)",
            marginBottom: "10px",
            marginTop: "10px",
          }}>
            Choose File
            <input onChange={handleChange} hidden multiple type="file" />
          </Button>
          <p>{file!=null && file.name}</p>
          <button className="button" onClick={handleUpload}>Upload  </button>  
          <progress value={progress} max="100" />
        </>
      }
      {url.map(f => (
        <div className="file">
          <TableRow key={f.name}>
            <TableCell> <Typography
              className="filesname"
            >{f.name}</Typography></TableCell>
            <TableCell>
              <Grid direction={'column'} display='flex' >
                <Button variant="contained" color="success" href={f.url} download>
                  تنزيل
                </Button>

                {(user.role === 0 || user.role === 1) &&
                  <>
                    <Button variant="contained" color="error" sx={{ mt: '25px' }} onClick={() => removeFile(f.url)} >
                      حذف
                    </Button>
                  </>
                }
              </Grid>
            </TableCell>
          </TableRow>
        </div>
      ))}
    </>
  );
};

export default FileUploadDownload;
