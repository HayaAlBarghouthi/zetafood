import "./datatable.scss";
import { React, useState, useEffect } from "react";
import Table from "@mui/material/Table";
import Typography from "@mui/material/Typography";
import {
  MenuItem,
  Paper,
  Select,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  deleteDoc,
  arrayRemove,
  getDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import CustomAlert from "../actions/CustomAlert";
import { CustomLoading } from "../actions/CustomLoading";
import { makeStyles } from "@material-ui/core";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';


const useStyles = makeStyles((theme) => ({
  paper: {
    margin: "10px",
    direction: "rtl",
    textAlign: "right",
    border: "1px solid #ddd",
    borderRadius: "5px",
  },
  table: {
    tableLayout: "fixed",
  },
  headerCell: {
    fontWeight: "bold",
    backgroundColor: theme.palette.grey[100],
    padding: "10px",
    width: "280hv",
  },
}));
const SelectedCustomerDataTable = ({ todayDateSelected, userId, isAdmin, setUser, user, isOther }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAlert, setIsAlert] = useState(false);
  const [visitId, setVisitID] = useState("");
  const [valuesForSelectedDay, setValuesForSelectedDay] = useState([]);
  const [dates, setDates] = useState([]);
  const [customerDataForWeek, setCustomerDataForWeek] = useState();
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "visitInformation", visitId)).then(async () => {
        if (isOther) {
          await setDoc(
            doc(db, "users", user.uid),
            {
              daysOther: arrayRemove(todayDateSelected),
            },
            { merge: true }
          );
        } else {
          await setDoc(
            doc(db, "users", user.uid),
            {
              days: arrayRemove(todayDateSelected),
            },
            { merge: true }
          );
        }

      });
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        localStorage.setItem("userInfo", JSON.stringify(docSnap.data()));
        setUser(JSON.parse(localStorage.getItem("userInfo")));
      }
      setIsLoading(false);
      console.log("Document successfully deleted!");
    } catch (error) {
      console.error("Error removing document: ", error);
    }
    handleClose();
  };


  const handleChange = (e, index, key) => {
    const newData = [...valuesForSelectedDay];
    newData[index][key] = e.target.innerText;
  };
  const classes = useStyles();

  const handleSelect = (e, index, key) => {
    const newData = [...valuesForSelectedDay];
    newData[index][key] = e.target.value;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await setDoc(
      doc(db, "visitInformation", visitId),
      {
        listOfCustomers: valuesForSelectedDay,
      },
      { merge: true }
    ).then(() => {
      setCustomerDataForWeek([]);
      setValuesForSelectedDay([]);
      getSelectedDayData();
      setDates([]);
      getSimilarDaysDate(todayDateSelected);
    });
    setIsAlert(true);
    const timer = setTimeout(() => {
      setIsAlert(false);
    }, 10000);
    return () => clearTimeout(timer);


  };

  const getSimilarDaysDate = async (inputStringDate) => {
    // Convert String Date
    const convertDateString = inputStringDate;
    const convertParts = convertDateString.split("-");
    const convertYear = convertParts[0];
    const convertMonth = convertParts[1] - 1; // month is 0-based
    const convertDay = convertParts[2];
    const inputDate = new Date(convertYear, convertMonth, convertDay);
    // Get all Similar Days from the selected date
    const inputDay = isOther ? "Other" : inputDate.getDay();
    // TODO:: Change Day
    const month = inputDate.getMonth();
    const year = inputDate.getFullYear();
    const numberOfDaysInMonth = new Date(year, month + 1, 0).getDate();
    var similarDays = [];
    if (inputDay != "Other") {
      for (let day = 1; day <= numberOfDaysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === inputDay) {
          similarDays.push(
            date.getFullYear() +
            "-" +
            (date.getMonth() + 1) +
            "-" +
            date.getDate()
          );
        }
      }
      similarDays=similarDays;
      async function fetchDataForSimilarDays(similarDays) {
        for (const day of similarDays) {
          const data = await getDataForThisDay(day);
          setCustomerDataForWeek(prevData => [...prevData, data]);
        }
      }
      setDates(similarDays);
      fetchDataForSimilarDays(similarDays).then(() => { setIsLoading(false); });
    } else {
      for (let day = 1; day <= numberOfDaysInMonth; day++) {
        const date = new Date(year, month, day);
        similarDays.push(
          date.getFullYear() +
          "-" +
          (date.getMonth() + 1) +
          "-" +
          date.getDate()
        );
      }
      similarDays = similarDays.filter(function (date) {
        return user.daysOther.indexOf(date) !== -1;
      });
      async function fetchDataForSimilarDays(similarDays) {
        for (const day of similarDays) {
          const data = await getDataForThisDay(day);
          setCustomerDataForWeek(prevData => [...prevData, data]);
        }
      }
      setDates(similarDays);
      fetchDataForSimilarDays(similarDays).then(() => { setIsLoading(false); });
    }
  };
  const getDataForThisDay = async (dayDate) => {
    try {
      const q = query(
        collection(db, "visitInformation"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      var listOfCustomersInThisDate = []; 
        
      querySnapshot.forEach((doc) => {
        // listOfCustomersInThisDate = doc.data().listOfCustomers;
        if(isOther){
          if(doc.data().dateOfVisit== dayDate && doc.data().day =="Other"){
            listOfCustomersInThisDate = doc.data().listOfCustomers;
            }
        }else{
          if(doc.data().dateOfVisit== dayDate && doc.data().day !="Other"){
            listOfCustomersInThisDate = doc.data().listOfCustomers;
            }
        }
      });
      return { date: dayDate, customersList: listOfCustomersInThisDate }
    } catch (error) {
      console.log(error);
    }
  };
  const getDataFromUsers = (date, customerId) => {
    const selectedDateCustomers =
      customerDataForWeek.find((data) => data.date == date)?.customersList ||
      [];
    const selectedCustomer = selectedDateCustomers.find(
      (customer) => customer.customerId === customerId
    );
    return selectedCustomer?.customerVisit;
  };

  const changeColor = (value, index) => {
    if (value === "موجود") {
      document.getElementById("customerVisit" + index).style.backgroundColor =
        "green";
    }
    if (value === "غير موجود") {
      document.getElementById("customerVisit" + index).style.backgroundColor =
        "red";
    }
  };
  useEffect(() => {
    setValuesForSelectedDay([]);
    setVisitID("");
    getSelectedDayData();
    setDates([]);
    setCustomerDataForWeek([]);
    getSimilarDaysDate(todayDateSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayDateSelected, isOther]);
  const getSelectedDayData = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "visitInformation"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        if(isOther){
          if(doc.data().dateOfVisit== todayDateSelected && doc.data().day =="Other"){
            setValuesForSelectedDay(doc.data().listOfCustomers);
            setVisitID(doc.id);
            }
        }else{
          if(doc.data().dateOfVisit== todayDateSelected && doc.data().day !="Other"){
            setValuesForSelectedDay(doc.data().listOfCustomers);
            setVisitID(doc.id);
            }
        }
      
       
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div>
        {isAlert && (
          <CustomAlert severity="success">
            {" "}
            تم تخزين البيانات بنجاح{" "}
          </CustomAlert>
        )}
        {isLoading ? (
          <CustomLoading />
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              {!isAdmin && (
                <>
                  <div className="buttonspace">
                    <Button variant="contained" color="success" type="submit">
                      حفظ
                    </Button>
                    <Button sx={{ mr: 2, ml: 2 }} variant="contained" color="error" onClick={handleClickOpen}>
                      حذف اليوم
                    </Button>
                  </div>
                </>
              )}
              <Paper className={classes.paper}>
                <Table className={classes.table}>
                  <TableHead >
                    <TableRow>
                      <TableCell sx={{ width: "350px" }} className={classes.headerCell}>
                        اسم الزبون
                      </TableCell>
                      <TableCell sx={{ width: "50px" }} className={classes.headerCell}>
                        الهدف
                      </TableCell>
                      <TableCell className={classes.headerCell}>
                        الزيارة المندوب
                      </TableCell>
                      <TableCell className={classes.headerCell}>
                        الهدف من الزيارة
                      </TableCell>
                      <TableCell className={classes.headerCell}>
                        ملاحظات المندوب
                      </TableCell>
                      <TableCell className={classes.headerCell}>
                        ملاحظات المشرف
                      </TableCell>

                      {dates.map((e, index) => {
                        let cellContent;
                        if (isOther) {
                          // Create a new Date object from the date string
                          const dateObj = new Date(e);
                          // Get the day of the month as a number (1-31)
                          const dayOfMonth = dateObj.getDate();
                          cellContent = dayOfMonth;
                        } else {
                          cellContent = `أسبوع ${index + 1}`;
                        }
                        // Render the TableCell with either the day of the month or the week number
                        return (
                          <TableCell
                            style={{ width: "50px" }}
                            className={classes.headerCell}
                          >
                            <span key={index}>
                              {cellContent}{" "}
                            </span>
                          </TableCell>
                        );
                      })}

                    </TableRow>
                  </TableHead>
                  {/* cHECK Loop */}
                  <TableBody>
                    {valuesForSelectedDay.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            InputProps={{
                              readOnly: true,
                            }}
                            // style={{ color: "white"}}
                            sx={{ width: "340px" }}
                            name="customerName"
                            variant="filled"
                            multiline
                            defaultValue={item.customerName}
                            onInput={(e) =>
                              handleChange(e, index, "customerName")
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="filled">
                            {item.saleTarget}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Select
                            readOnly={isAdmin}
                            id={"customerVisit" + index}
                            variant="filled"
                            defaultValue={item.customerVisit}
                            name="customerVisit"
                            onChange={(e) => {
                              handleSelect(e, index, "customerVisit");
                              changeColor(e.target.value, index);
                            }}
                            style={{
                              width: "100%",
                              color: "white",
                              backgroundColor:
                                item.customerVisit != ""
                                  ? item.customerVisit === "موجود"
                                    ? "green"
                                    : "red"
                                  : "",
                            }}
                          >
                            <MenuItem value={""}>فارغ</MenuItem>
                            <MenuItem value={"موجود"}>موجود</MenuItem>
                            <MenuItem value={"غير موجود"}>غير موجود</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            readOnly={isAdmin}
                            variant="filled"
                            defaultValue={item.visitGoal}
                            name="visitGoal"
                            onChange={(e) =>
                              handleSelect(e, index, "visitGoal")
                            }
                            style={{ width: "100%" }}
                          >
                            <MenuItem value={""}>فارغ</MenuItem>
                            <MenuItem value={"بيع"}>بيع</MenuItem>
                            <MenuItem value={"تحصيل"}>تحصيل</MenuItem>
                            <MenuItem value={"بيع + تحصيل"}>
                              بيع + تحصيل
                            </MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            InputProps={{
                              readOnly: isAdmin,
                            }}
                            fullWidth
                            variant="filled"
                            multiline
                            maxRows={4}
                            name="note"
                            defaultValue={item.note}
                            onChange={(e) => handleSelect(e, index, "note")}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            InputProps={{
                              readOnly: user.role != 1,
                            }}
                            fullWidth
                            variant="filled"
                            multiline
                            maxRows={4}
                            name="superNote"
                            defaultValue={item.supervisornote}
                            onChange={(e) =>
                              handleSelect(e, index, "superNote")
                            }
                          />
                        </TableCell>
                        {dates.map((e, index) => {
                          
                          let cellContent;
                          const customerData = getDataFromUsers(dates[index], item.customerId);
                          if (customerData === "موجود") {
                            cellContent = (
                              <TableCell
                                key={index}
                                style={{ backgroundColor: "green", color: "white" }}
                              >
                                موجود
                              </TableCell>
                            );
                          } else if (customerData === "غير موجود") {
                            cellContent = (
                              <TableCell
                                key={index}
                                style={{ backgroundColor: "red", color: "white" }}
                              >
                                غير موجود
                              </TableCell>
                            );
                          } else {
                            cellContent = (
                              <TableCell
                                key={index}
                                style={{ backgroundColor: "white", color: "white" }}
                              ></TableCell>
                            );
                          }
                          // Render the TableCell with the background color depending on the customer data
                          return cellContent;
                        })}

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </form>
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>حذف اليوم بالكامل</DialogTitle>
              <DialogContent>
                <p> هل انت متاكد من حذف اليوم بالكامل؟
                </p>
              </DialogContent>
              <DialogActions>
                <Button variant="contained" color="success" onClick={handleClose}>الغاء</Button>
                <Button variant="contained" color="error" onClick={handleDelete} autoFocus>
                  حذف
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </div>
    </>
  );
};

export default SelectedCustomerDataTable;

