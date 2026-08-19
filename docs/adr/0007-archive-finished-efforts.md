# Archive finished Efforts

The **Reader** stays forbidden from editing, claiming, or resolving **Tickets**. It may **Archive** a **Finished** Effort after an explicit confirm: move `.scratch/<slug>/` to `.scratch/.archive/<slug>/`. Load never archives. Hard delete is out. There is no Archive list and no Restore in the Reader; recovery is moving the directory back on disk. The **Unresolved filter** only hides live Finished Efforts; Archive is the write.

Rejected: auto-archive on Load; `rm` of the Effort; a Skip-prompt that leaves the Reader read-only for this job; an in-app Archive view.
