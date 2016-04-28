class RenameVirtualServerDetailsTable < ActiveRecord::Migration
  def change
    rename_table :virtual_server_details, :template_server_details
  end
end
