# Using MongoDB Atlas with College Lost & Found

The app already uses Mongoose and reads the database address from `MONGO_URI` in `server/.env`.
So moving to MongoDB Atlas needs **no code changes** - only a new connection string.

## 1. Create the Atlas cluster
1. Sign up / log in at https://www.mongodb.com/cloud/atlas
2. Create a project, then **Build a Database** -> choose the free **M0** tier -> pick a region -> Create.

## 2. Create a database user
- **Security -> Database Access -> Add New Database User**
- Authentication: Password. Save the username and password.
- If the password has special characters (`@ : / ? # %`), URL-encode them (e.g. `@` -> `%40`).

## 3. Allow network access
- **Security -> Network Access -> Add IP Address**
- For development, choose **Allow access from anywhere** (`0.0.0.0/0`), or add your own IP.

## 4. Get the connection string
- **Database -> Connect -> Drivers** (Node.js) -> copy the `mongodb+srv://...` string.

## 5. Update `server/.env`
Replace the existing `MONGO_URI` line (keep PORT and JWT_SECRET):

```
MONGO_URI=mongodb+srv://<db_username>:<db_password>@<cluster-name>.xxxxx.mongodb.net/college_lost_found?retryWrites=true&w=majority
```

`college_lost_found` is the database name; Atlas creates it automatically on first write.
See `server/.env.example` for a template.

## 6. Run
```
cd server
npm install
npm run dev
```
You should see `MongoDB connected successfully`. Collections (`users`, `items`, `claims`)
and the unique indexes are created automatically by Mongoose on first use.

Verify in Atlas: **Database -> Browse Collections**.

## Troubleshooting
| Error | Fix |
|---|---|
| `bad auth` / Authentication failed | Wrong username/password, or special characters not URL-encoded |
| `ENOTFOUND` / `querySrv` error | Check the cluster host in the URI; check your internet/DNS |
| Timeout / `Server selection timed out` | Your IP isn't in Network Access |
| Data missing after switching | Atlas is a fresh database; local data is not migrated |

## Deploying
Set `MONGO_URI` (and `JWT_SECRET`, `PORT`) as environment variables on your host
(Render, Railway, etc.). Never commit `server/.env` - it is already in `.gitignore`.

## Optional: migrate existing local data
```
mongodump --uri="mongodb://127.0.0.1:27017/college_lost_found" --out=./dump
mongorestore --uri="<your Atlas URI>" --nsInclude="college_lost_found.*" ./dump
```
