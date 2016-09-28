class CreateVirtualServerDetails < ActiveRecord::Migration
  def change
    create_table :template_server_details do |t|
      t.references  :server_type, index: true
      t.references  :server_part, index: true
      t.integer     :count
      t.timestamps null: false
    end
  end
end
