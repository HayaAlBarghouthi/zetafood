import {Grid} from "@material-ui/core";
import React from "react";
import CustomerDataTable from "../../components/customers/CustomerDataTable";
import CustomerForm from "../../components/customers/CustomerForm";
import Navbar from "../../components/navbar/Navbar";

const Customers = () => {
  return (
    <>
      <Navbar />
      <Grid container>
        <Grid item xs={8}>
          <CustomerDataTable />
        </Grid>
        <Grid item xs={4}>
            <CustomerForm />
        </Grid>
      </Grid>
    </>
  );
};

export default Customers;
