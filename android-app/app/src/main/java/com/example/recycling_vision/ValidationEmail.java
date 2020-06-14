package com.example.recycling_vision;

public class ValidationEmail {
    private int userIDReference;
    private String toEmail;
    private final String fromEmail = ""; //TODO: Set up email account to handle sending validation emails

    public void sendEmail(){

    }

    public void setUserIDReference(int newUserIDReference){
        userIDReference = newUserIDReference;
    }

    public int getUserIDReference(){
        return userIDReference;
    }
}
