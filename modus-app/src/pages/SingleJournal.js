import React from "react";
import { Card, Grid, IconButton } from "@mui/material";
import { makeStyles } from '@mui/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import {deleteJournalEntry, getMHResources} from "../firebase";
import { useHistory } from "react-router";

const useStyles = makeStyles({
  card: {
    width: 800,
    height: 900,
    padding: 20,
    marginLeft: 150,
    marginTop: 25
  },
});

function SingleJournal() {
  // const history = useHistory();
//   const handleDeleteEntry = () => {
//     deleteJournalEntry(entry.jid)
//     .then(() => {
//       console.log("DELETE JOURNAL ENTRY")
//       // window.location.href='/library';
//     }) 
//   }

  const classes = useStyles();
    return (
      <div>
          <Card className={classes.card}>
          <Grid container direction="column">
            <Grid container style={{marginBottom: 5}} justifyContent='end'>
              {/* <IconButton onClick={() => handleDeleteEntry()}> */}
              <IconButton>
                <DeleteIcon/>
              </IconButton>
            </Grid>
            <Grid container>
              <Grid container item>
                <Grid item xs 
                  style={{
                    fontSize: 24,
                    marginBottom: 10
                  }}
                >
                    TITLE
                  {/* {entry.title} */}
                </Grid>
                <Grid item 
                  style={{
                    fontSize: 18,
                    marginTop: 6,
                    marginBottom: 10
                  }}
                >
                  {/* {entry.createdAt} */}
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs>
                Content
              {/* {entry.text} */}
            </Grid>
            <Grid item xs 
                  style={{
                    fontSize: 16,
                    marginTop: 20
                  }}
            >
                STATUS
              {/* {entry.status} */}
            </Grid>  
          </Grid>
      </Card>
      </div>
    );
  }
  export default SingleJournal;