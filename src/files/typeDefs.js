//AUTH
export const usersTypeDef = `
input UserInput {
    name:String!
    email:String!
    password:String!
    mobil: String
}
type UserPostOut{
    advise: String
    id :Int
    token: String
    error: String
    email: String
    name:String
}
input UserPutIn{
    id: Int!
    new_name:String!
}
input UserDelIn{
    email: String!
}

type UserPutOut{
    advise:String!
}
input SessionInput{
    email:String!
    password:String!
    mobil: String
}
type SessionOut{
    advise:String
    token:String
    email: String
    name:String
}
input TokenInput{
    email:String!
    token:String!
    mobil: String
}

input LogoutInput{
    email:String!
    mobil: String
}

`;
export const userMutations = `
    createUser(user: UserInput!):UserPostOut!
    updateUser(user: UserPutIn!):UserPutOut!
    deleteUser(user: UserDelIn!):UserPutOut!
    userSession(user: SessionInput!):SessionOut!
    logOut(user: LogoutInput!)
`;

//ORGANIZATION
export const organizationTypeDef = `
type Movement {
    move_id: Int
    owner: String
    origin: String
    destiny: String
    date: String
    advise: String
}
type MoveOut {
    list: [Movement]
    advise: String
}
input MovementInput {
    owner: String!
    origin: String!
    destiny: String!
}
type CreateFolder {
    create_id: Int
    owner: String
    path: String
    date: String
    advise:String
}
type CreateOut {
    list:[CreateFolder]
    advise: String
}
input CreateFolderInput {
    owner: String!
    path: String!
}
type Delete {
    del_id: Int
    owner: String
    path: String
    date: String
    advise:String
}
type DeleteOut {
    list:[Delete]
    advise: String
}
input DeleteInput {
    owner: String!
    path: String!
}`;
export const organizationQueries = `
    allMovements(input:TokenInput!): MoveOut!
    allCreations(input:TokenInput!): CreateOut!
    allDeletes(input:TokenInput!): DeleteOut!
`;
export const organizationMutations = `
    createFolder(create: CreateFolderInput! , input: TokenInput!): CreateFolder!
    moveFile(move: MovementInput!,input:TokenInput!): Movement!
    deleteFile(del: DeleteInput!,input:TokenInput!): Delete!
`;
//DOWNLOAD
export const downloadTypeDef = `
type File {
    files: [File],
    name: String
    owner: String
    path: String

}
input Owner{
    owner:String!
}
input DowloadInput{
    path: String!
}
type DownloadOut {
    base64: String
    name: String
}

input Path {
    path: String!
}

`;
export const downloadQueries = `
    
`;

export const downloadMutations = `
    downloadFile(file: Path!,input:TokenInput!):DownloadOut
    downloadList(owner: Owner!,input:TokenInput!): File
`;



//DOWNLOAD
export const uploadTypeDef = `

scalar Upload

input UploadInput {
    uploads: [Upload!]!
    name: String!
    description: String!
    owner: String!
}


  type UploadOut {
    name: String
    description: String
    owner: String
    path: String
    advise:String
  }

`;

export const uploadMutations = `
    uploadFiles(files: UploadInput!,input:TokenInput!): UploadOut!
`;

//soap

export const soapTypeDef = `

input SoapInput {
    username: String!
}
type Data {
    id: Int
    image: String
    image_base64:String
    id_user:String
    createdAt: String
    updatedAt: String
  }

  type SoapOut {
    data: [Data]
  }

`;

export const soapMutations = `
    soapConsume(soap: SoapInput!): SoapOut!
`;