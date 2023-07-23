import { Grid } from "@mui/material";
import Navbar from "../../components/navbar/Navbar";
import ReportData from "./ReportData";

const Report = () => {
    return (<>
        <Navbar />
        <Grid container>
          <Grid item xs={8}>
            {/* <CustomerDataTable /> */}
            <ReportData />
          </Grid>
          {/* <Grid item xs={4}>
              <CustomerForm />
          </Grid> */}
        </Grid>
      </>);
}
 
export default Report;