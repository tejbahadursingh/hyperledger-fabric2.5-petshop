$(document).ready(function () {
    $(".btnadopt").click(function (el) {
        let assetID = el.target.value;
        $("#"+el.target.id).text("processing");
        $("#"+el.target.id).prop('disabled',true);
        console.log(assetID)
       $.post("/adopt",
          {
             assetID: assetID,
            //  owner: "Professional gamer"
          },
          function (data, status) {
            if (data.status) {
                console.log(data);
                $("#"+el.target.id).text("Adopted");
                $("#"+el.target.id).prop('disabled',true);
            } else {
                $("#"+el.target.id).text("Adopt");
                $("#"+el.target.id).prop('disabled',false);
                $('.modal').modal('show');
            }
          });
    });

    $(".btnnormalhistory").click(function (el) {
        let assetID = el.target.value;
        // $("#"+el.target.id).text("processing");
        // $("#"+el.target.id).prop('disabled',true);
        console.log(assetID)
        // "/petdetail?uid="+assetID+"&type=nrml"
       $.get("/checkloggedin",
          {},
          function (data, status) {
            if (data.status) {
                console.log(data);
                window.location.replace("/petdetail?uid="+assetID+"&type=nrml");

            } else {
                $('.modal').modal('show');
            }
          });
    });

    $("#pethistory").click(function (el) {
        let assetID = $("#pethistory").attr("petid");
        console.log(assetID);
       $.get("/pethistory",
          {
             assetID: assetID,
          },
          function (data, status) {
            console.log(data);
            let tablestart = '<table id="restable" border="1px" width="100%">';
            let tableclose = '</table>';
            let tableheader = '<tr>'
                                    +'<th>Name</th>'
                                    +'<th>Picture</th>'
                                    +'<th>Owner</th>'
                                    +'<th>Location</th>'
                                    +'<th>Age</th>'
                                    +'<th>Vaccination Date</th>'
                                    +'<th>Vaccine Name</th>'
                                    +'<th>TX Time</th>'
                                +'</tr>';
            let tablebody='';
            data.pets.forEach(element => {
                let datepart = element.timestamp.split('T')[0];
                let timepart = element.timestamp.split('T')[1].split('.')[0];
                let displaydate = datepart+" "+timepart;
                tablebody+='<tr>'
                                +'<td>'+element.record.Name+'</td>'
                                +'<td><img id="petimg" src="'+element.record.Picture+'" alt="Pet Image" style="width:100%; max-width:75px" ></td>'
                                +'<td>'+element.record.Owner+'</td>'
                                +'<td>'+element.record.Location+'</td>'
                                +'<td>'+element.record.Age+'</td>'
                                +'<td>'+element.record.vaccinationDate+'</td>'
                                +'<td>'+element.record.vaccinationName+'</td>'
                                +'<td>'+displaydate+'</td>'
                            +'</tr>';
            });
            let tableresponse = tablestart+tableheader+tablebody+tableclose;
            $("#historydiv").html(tableresponse);            

          });
    });

 });